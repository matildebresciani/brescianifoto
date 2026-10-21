import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const source = new URL('../docs/client-galleries/PLAN.md', import.meta.url);
const markdown = readFileSync(source, 'utf8');
const match = markdown.match(/```client-gallery-tasks\n([\s\S]*?)\n```/);
if (!match) throw new Error('Missing client-gallery-tasks record block.');
const tasks = JSON.parse(match[1]);
const statuses = ['To do', 'In progress', 'Blocked', 'Done'];
for (const task of tasks) {
    if (!statuses.includes(task.status) || !Array.isArray(task.acceptance)) throw new Error(`Invalid task ${task.id}`);
    if (task.dependencies.some((id) => !tasks.some((candidate) => candidate.id === id))) {
        throw new Error(`Unknown dependency on ${task.id}`);
    }
}
const escapeHTML = (value) =>
    String(value).replace(
        /[&<>"']/g,
        (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char],
    );
const isReady = (task) =>
    task.status === 'To do' && task.dependencies.every((id) => tasks.find((item) => item.id === id)?.status === 'Done');
const done = tasks.filter((task) => task.status === 'Done').length;
const next =
    tasks.find((task) => task.status === 'In progress') ??
    tasks.find(isReady) ??
    tasks.find((task) => task.status === 'Blocked');
const items = (values) => values.map((value) => `<li>${escapeHTML(value)}</li>`).join('');
const cards = tasks
    .map(
        (task) =>
            `<article id="${task.id}" data-status="${escapeHTML(task.status)}" data-ready="${isReady(task)}"><div class="row"><span class="id">${task.id}</span><span class="badge">${escapeHTML(task.status)}${isReady(task) ? ' · Ready' : ''}</span></div><h2>${escapeHTML(task.title)}</h2><p>${escapeHTML(task.description)}</p><p class="dependency">Depends on ${task.dependencies.length ? task.dependencies.join(', ') : 'nothing — start here'}</p><details><summary>Requirements &amp; evidence</summary><h3>Acceptance criteria</h3><ul>${items(task.acceptance)}</ul><h3>Notes</h3><ul>${items(task.notes.length ? task.notes : ['No notes yet.'])}</ul><h3>Verification</h3><ul>${items(task.evidence.length ? task.evidence : ['Not verified yet.'])}</ul></details></article>`,
    )
    .join('');
const output = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Client galleries — project tracker</title><style>
:root{--bg:#faffef;--surface:#f0f3e6;--ink:#151611;--muted:#55584c;--border:#c4c8bb}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font-family:Arial,sans-serif;font-size:clamp(.9375rem,.902rem + .18vw,1.0625rem);line-height:1.6}main{max-width:1400px;margin:auto;padding:clamp(1rem,4vw,4rem)}header{border-bottom:1px solid var(--border);padding-bottom:2rem}h1{font-family:Georgia,serif;font-weight:400;font-size:clamp(2.5rem,1.36rem + 5.7vw,6.5rem);line-height:1;margin:1.5rem 0}h2{font-size:clamp(1.125rem,1.05rem + .36vw,1.375rem);line-height:1.2}h3,summary,button{font-size:inherit}p{max-width:65ch;color:var(--muted)}a{color:inherit}progress{width:100%;height:12px;accent-color:var(--ink)}.row,.stats,.filters{display:flex;gap:1rem;flex-wrap:wrap;align-items:center;justify-content:space-between}.stats{margin:2rem 0;justify-content:flex-start;gap:3rem}.stats strong{display:block;font-size:clamp(1.75rem,1.54rem + 1.07vw,2.5rem)}.next{background:var(--surface);padding:1.5rem;margin:2rem 0}.filters{justify-content:flex-start;margin:2rem 0}button{border:1px solid var(--border);background:transparent;padding:.6rem 1rem;color:var(--ink);cursor:pointer}button[aria-pressed=true]{background:var(--ink);color:var(--bg)}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr));gap:1rem}article{border:1px solid var(--border);padding:1.5rem}article[hidden]{display:none}.id,.badge,.dependency{font-size:clamp(.75rem,.714rem + .18vw,.875rem)}.badge{background:var(--surface);padding:.2rem .5rem}summary{cursor:pointer;text-decoration:underline;text-underline-offset:4px}details{border-top:1px solid var(--border);padding-top:1rem}footer{margin-top:3rem;color:var(--muted)}:focus-visible{outline:2px solid var(--ink);outline-offset:4px}
</style></head><body><main><header><span>brescianifoto / Project journal</span><h1>Client galleries</h1><p>A considered place to deliver a wedding day. Follow the work from the first upload to the final handover.</p><div class="stats"><div><strong>${done} / ${tasks.length}</strong>assignments complete</div>${statuses.map((status) => `<div><strong>${tasks.filter((task) => task.status === status).length}</strong>${status}</div>`).join('')}</div><progress value="${done}" max="${tasks.length}" aria-label="Completed assignments"></progress></header><aside class="next"><strong>Next assignment</strong><p>${next ? `${next.id} · ${escapeHTML(next.title)}` : 'No ready assignments. Review blockers below.'}</p></aside><nav class="filters" aria-label="Filter tasks">${['All', ...statuses, 'Ready'].map((filter) => `<button type="button" data-filter="${filter}" aria-pressed="${filter === 'All'}">${filter}</button>`).join('')}</nav><section aria-label="Handover"><h2>Handover</h2><div class="grid"><article><h3>Needs attention</h3><ul>${tasks
    .filter((task) => task.status === 'Blocked')
    .map(
        (task) =>
            `<li><a href="#${task.id}">${task.id} · ${escapeHTML(task.title)}</a><p>${escapeHTML(task.notes[0] || 'Review task notes.')}</p></li>`,
    )
    .join('')}</ul></article><article><h3>Recent completion notes</h3><ul>${tasks
    .filter((task) => task.status === 'Done')
    .slice(-3)
    .reverse()
    .map((task) => `<li><strong>${task.id}</strong><p>${escapeHTML(task.notes.at(-1) || task.title)}</p></li>`)
    .join(
        '',
    )}</ul></article></div></section><h2>All assignments</h2><section class="grid" aria-label="Assignments">${cards}</section><footer><p>Source of truth: <a href="./PLAN.md">PLAN.md</a>. Update task records there and run <code>node scripts/render-client-gallery-plan.mjs</code>. Filters do not edit progress. This file is local and is not published with the website.</p></footer></main><script>document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{const filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));document.querySelectorAll('article[data-status]').forEach(card=>{card.hidden=filter!=='All'&&(filter==='Ready'?card.dataset.ready!=='true':card.dataset.status!==filter)})}));</script></body></html>`;
const destination = new URL('../docs/client-galleries/dashboard.html', import.meta.url);
writeFileSync(destination, output);
console.log(`Generated ${fileURLToPath(destination)} (${done}/${tasks.length} complete)`);
