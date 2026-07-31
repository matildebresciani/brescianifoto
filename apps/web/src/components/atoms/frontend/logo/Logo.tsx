import LogoImg from '@public/favicon.svg';
import Image, { type ImageProps } from 'next/image';
import type { FC } from 'react';
import { cn } from '@/lib/utilities/ui';

export type LogoProps = Omit<Partial<ImageProps>, 'src'>;

const Logo: FC<LogoProps> = ({ className, ...rest }) => {
    // TODO: Add brand to logo alt text
    return <Image src={LogoImg} alt={'logo'} className={cn('max-w-8', className)} {...rest} />;
};

export default Logo;
