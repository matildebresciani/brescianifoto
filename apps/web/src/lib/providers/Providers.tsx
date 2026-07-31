import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import type { FC } from 'react';
import ReactQueryProvider from './ReactQueryProvider';

type Props = {
    children: React.ReactNode;
};

export const Providers: FC<Props> = async ({ children }) => {
    const messages = await getMessages();
    return (
        <NextIntlClientProvider messages={messages}>
            <ReactQueryProvider>{children}</ReactQueryProvider>
        </NextIntlClientProvider>
    );
};

export default Providers;
