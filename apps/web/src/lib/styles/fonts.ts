import { Archivo, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google';

export const archivo = Archivo({
    weight: ['400', '500', '700', '900'],
    variable: '--font-loaded-archivo',
    style: ['normal'],
    subsets: ['latin'],
});
export const ibmPlexMono = IBM_Plex_Mono({
    weight: ['400', '500'],
    variable: '--font-loaded-metadata',
    style: ['normal'],
    subsets: ['latin'],
});
export const instrumentSerif = Instrument_Serif({
    weight: '400',
    variable: '--font-loaded-statement',
    style: ['normal'],
    subsets: ['latin'],
});
