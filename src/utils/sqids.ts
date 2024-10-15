import Sqids from 'sqids';

export function newSqids(): Sqids {
    return new Sqids({
        minLength: 7,
        alphabet: '23456789CFGHJMPQRVWX',
        blocklist: new Set([])
    })
}