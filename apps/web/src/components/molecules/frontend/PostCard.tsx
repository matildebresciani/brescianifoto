'use client';
import { DateTime } from 'luxon';
import { motion } from 'motion/react';
import Link from 'next/link';
import { ImageMedia } from '@/components/atoms/frontend/media/ImageMedia';
import LinkArrow from '@/components/atoms/frontend/ui/LinkArrow';
import type { Locale } from '@/i18n/localized-collections';
import { topDownToggle } from '@/lib/motion/motion-variants';
import { formatLinkByCollection } from '@/lib/utilities/format-link';
import type { Post } from '@/payload-types';

type Props = {
    data: Post;
    locale: Locale;
};

const PostCard = ({ data, locale }: Props) => {
    const link = formatLinkByCollection(data.slug, 'posts', locale);
    if (!link) return null;

    return (
        <motion.div variants={topDownToggle} transition={{ duration: 0.2 }} className="h-full overflow-hidden">
            <Link href={link} className="flex flex-col gap-2 h-full group">
                <div className="relative max-h-[300px] w-full mb-3 aspect-[470/270] overflow-hidden rounded-corners">
                    {data.contentMeta?.featuredImage && (
                        <ImageMedia
                            resource={data.contentMeta.featuredImage}
                            className="object-cover transition group-hover:scale-105"
                            fill
                        />
                    )}
                </div>
                <p className="heading-5 font-semibold">{data.title}</p>
                {data.contentMeta?.excerpt && <p className="mb-6 text-oak-gray-dark">{data.contentMeta.excerpt}</p>}
                <div className="flex flex-col gap-y-2 gap-x-5 mt-auto sm:justify-between md:flex-row md:items-center">
                    {data.categories && (
                        <div className="relative flex flex-wrap gap-2 overflow-hidden">
                            {data.categories.map((category) => {
                                if (typeof category === 'string') return null;

                                return (
                                    <span
                                        key={category.id}
                                        className="category paragraph-small block max-w-full py-2 px-4 border border-oak-gray-dark rounded-[13px] font-bold truncate"
                                    >
                                        {category.title}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    <div className="relative flex items-center min-h-[60px] sm:ml-auto">
                        <LinkArrow className="absolute top-0 right-0 opacity-0 transition group-hover:opacity-100" />
                        {data.publishedAt && (
                            <span className="paragraph-small font-bold whitespace-nowrap transition group-hover:opacity-0">
                                {DateTime.fromISO(data.publishedAt)
                                    .setLocale(locale)
                                    .setZone('Europe/Copenhagen')
                                    .toFormat('dd. LLLL, yyyy')}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
};

export default PostCard;
