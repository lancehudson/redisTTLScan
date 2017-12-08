# redisTTLScan
SScans redis for keys that match, have no ttl set and optionally sets one

## usage

`redisTTLScan [options]`

### options

    -V, --version                  output the version number
    -t, --ttl [ttl]                set TTL
    -c, --cluster
    -r, --host [host]              host
    -p, --port [port]              port
    -k, --match [match]            hash keys regex to scan for
    -h, --help                     output usage information

## examples

Scan cluster for any keys `updates:*` and missing a ttl

`rredisTTLScan -cr 192.168.99.100 -k updates:* -t 604800`
