import { AnimatePresence } from 'motion/react';
import * as motion from 'motion/react-client';
import BaseBlock from '@/components/organisms/blocks/base-block/BaseBlock';
import { defaultLocale, type Locale } from '@/i18n/localized-collections';
import { initPayload } from '@/lib/config';
import { staggerChildrenVariantsNoExitStagger } from '@/lib/motion/motion-variants';
import { cn } from '@/lib/utilities/ui';
import type { Post } from '@/payload-types';
import PostCard from './PostCard';
import UpdateParamSelector from './UpdateParamSelector';

type Props = {
    entries: Post[];
    locale: Locale;
    order: string;
    tag: string;
    showFilter?: boolean;
};

const PostArchive = async ({ entries, locale, order, tag, showFilter }: Props) => {
    const payload = await initPayload();

    const key = `${order}-${tag}`;

    const categories = await payload.find({
        collection: 'post-categories',
        limit: 100,
        locale: locale,
        depth: 1,
    });

    const filteredCategories = categories?.docs
        ?.filter((category) => category.viewPostsInCategory?.docs?.length)
        .map((category) => (category.slug ? { value: category.slug, label: category.title } : undefined))
        .filter((category) => category !== undefined);

    // TODO: Transate
    filteredCategories.unshift({ value: '', label: 'Kategorier' });

    return (
        <BaseBlock>
            <div className="oakgrid">
                <div className="col-span-12 flex flex-wrap gap-5 mb-10">
                    <UpdateParamSelector
                        options={[
                            {
                                value: 'title',
                                label: 'A-Z',
                            },
                            {
                                value: '-title',
                                label: 'Z-A',
                            },
                            {
                                value: '-createdAt',
                                label: 'New to old',
                            },
                            {
                                value: 'createdAt',
                                label: 'Old to new',
                            },
                        ]}
                        getParam="order"
                        defaultValue={order ?? 'title'}
                    />
                    {showFilter && (
                        <UpdateParamSelector options={filteredCategories} getParam="tag" defaultValue={tag ?? ''} />
                    )}
                </div>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={key}
                        variants={staggerChildrenVariantsNoExitStagger}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.1 }}
                        className={cn('col-span-12 grid gap-7 md:grid-cols-2 lg:grid-cols-3')}
                    >
                        {entries.map((entry) => (
                            <PostCard key={entry.id} data={entry} locale={locale ?? defaultLocale} />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </div>
        </BaseBlock>
    );
};

export default PostArchive;
