import { Link } from '@/i18n/routing';
import Logo from './Logo';

const LogoLink = () => {
    return (
        <Link href="/">
            <Logo />
        </Link>
    );
};

export default LogoLink;
