'use client';

import { DateTime } from 'luxon';
import { motion } from 'motion/react';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import type { Locale } from '@/i18n/localized-collections';
import { downUpToggle } from '@/lib/motion/motion-variants';
import { getGalleryCoverImage, payloadObject } from '@/lib/utilities/composables';
import type { Gallery } from '@/payload-types';
import Tag from './Tag';

type Props = {
    data: Gallery;
    locale: Locale;
};

const GalleryHero = ({ data, locale }: Props) => {
    const cover = getGalleryCoverImage(data);
    const tags = data.tags?.map((item) => payloadObject(item)).filter((item) => item !== undefined) ?? [];
    const location = payloadObject(data.location);

    const metaParts = [
        data.date
            ? DateTime.fromISO(data.date).setLocale(locale).setZone('Europe/Copenhagen').toFormat('dd LLL yyyy')
            : null,
        location ? [location.name, location.city].filter(Boolean).join(', ') : null,
    ].filter(Boolean);

    return (
        <section className="relative min-h-[45vh] w-full overflow-hidden sm:min-h-[55vh] lg:min-h-[65vh]">
            {cover && <ImageMedia resource={cover} fill priority className="object-cover" size="100vw" />}

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-bg-base/90 to-transparent" />

            <motion.div
                variants={downUpToggle}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="absolute inset-x-0 bottom-0 flex flex-col gap-xs p-base md:p-lg"
            >
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-xs">
                        {tags.map((tag) => (
                            <Tag key={tag.id} tag={tag} locale={locale} />
                        ))}
                    </div>
                )}

                <h1 className="heading-1 text-fg-base">{data.title}</h1>

                {metaParts.length > 0 && <p className="caption">{metaParts.join(' · ')}</p>}
            </motion.div>
        </section>
    );
};

export default GalleryHero;
