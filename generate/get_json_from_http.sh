#/bin/bash
for var in `seq 1 2022`
do
curl -sSL -o json_get/$var.json  https://arweave.net/I0pf0QkI97IJM7jPyqgXMpHwuyEpLKt78cT73LhTB_U/$var.json
done