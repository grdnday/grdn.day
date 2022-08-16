import base58
from solana.keypair import Keypair

keypair = Keypair()

print(keypair.public_key.to_base58())
print(base58.b58encode(keypair.secret_key))