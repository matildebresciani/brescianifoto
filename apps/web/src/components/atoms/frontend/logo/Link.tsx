import { Link } from '@/i18n/routing';
import Logo from './Logo';

const LogoLink = () => {
    return (
        <Link href="/" className="logo-link focus-ring w-fit max-w-full">
            <Logo />
        </Link>
    );
};

export default LogoLink;
