import { Link } from '@/i18n/routing';
import Logo from './Logo';

const LogoLink = () => {
    return (
        <Link href="/" className="focus-ring w-fit opacity-100 transition-opacity hover:opacity-70">
            <Logo />
        </Link>
    );
};

export default LogoLink;
