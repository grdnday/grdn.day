# grdn.day

Welcome to the grdn.day monorepo.

grdn.day is an open source garden sim game where all of the plants in your garden are NFT's.

The game is currently in beta and was created with ❤️ for the [solana summercamp](https://solana.com/summercamp) hackathon.



[![grdn.day - solana summercamp 2022 demo](https://i.vimeocdn.com/video/1489386006-865ecc58f2f744c0a48d6eadbb0b1764eef24bc8b4c7ddaa59bab4ce87b491ea-d_400x600)](https://vimeo.com/740139188)

### Developers
The game's code consists of 2 parts

[app](./app) - Web Application  
[garden](./garden) - Garden Solana Program  


### Concepts

1. plants are NFT's
2. plants are minted as seeds and planted 
3. plants change appearance over time
4. plants can be extended graphically and onchain
5. plants state is based on age and maintenance
6. player can burn `water` to help plants grow
7. players can trade plants and seeds for the most beautiful garden
8. digital things can be living too


### Hackathon Dev Roadmap

Stage 1. Create components
- [X] build farming game UI with React
- [X] create garden program to store nfts
- [X] create candy machine of plants for gameplay

Stage 2. Connect components
- [X] mint token from candy machine from UI
- [X] move token into garden contract from UI
- [X] add to exisiting garden

Stage 3. Prepare for hackathon / public release
- [X] refactor and document each section
- [X] remove extra code/comments and setup git
