import Link from 'next/link';
import BaseBlock from '@/components/organisms/blocks/base-block/BaseBlock';

export default function NotFound() {
    return (
        <BaseBlock className="flex flex-col items-start gap-md">
            <h1 className="heading-1">Page not found</h1>
            <p className="body-md">This page may have moved or is no longer available.</p>
            <div className="ui-text flex flex-wrap gap-md">
                <Link href="/" className="focus-ring underline underline-offset-4">
                    Home
                </Link>
                <Link href="/galleries/concerts" className="focus-ring underline underline-offset-4">
                    Concerts
                </Link>
            </div>
        </BaseBlock>
    );
}
