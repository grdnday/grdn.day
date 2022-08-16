use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, SetAuthority, TokenAccount, Transfer};
use spl_token::instruction::AuthorityType;

declare_id!("55KrogTBFDAg2XvdbgdzqoPRJWga89QQwD4nj7qBBpKC");

#[program]
pub mod garden {
    use super::*;

    const GARDEN_PDA_SEED: &[u8] = b"garden";

    /// create a new garden and place an intial NFT inside of it
    pub fn initialize(
        ctx: Context<Initialize>,
        _vault_account_bump: u8,
        position: u8,
    ) -> Result<()> {
        let (vault_authority, _vault_authority_bump) =
            Pubkey::find_program_address(&[GARDEN_PDA_SEED], ctx.program_id);

        let garden_account = &mut ctx.accounts.garden_account;

        // get next available
        let mut next_available = 0;

        for i in 0..12 {
            if garden_account.grid[i] == anchor_lang::system_program::ID {
                break;
            } else {
                next_available += 1;
            }
        }
        for i in 0..12 {
            if garden_account.positions[i] == position {
                // exit early since we already have a nft in that position
                return Ok(());
            }
        }

        garden_account.grid[next_available] = *ctx.accounts.mint.to_account_info().key;
        garden_account.positions[next_available] = position;

        token::set_authority(
            ctx.accounts.into_set_authority_context(),
            AuthorityType::AccountOwner,
            Some(vault_authority),
        )?;

        token::transfer(ctx.accounts.into_transfer_to_pda_context(), 1)?;

        Ok(())
    }

    /// update existing garden with a new plant
    pub fn plant(ctx: Context<Plant>, _vault_account_bump: u8, position: u8) -> Result<()> {
        let (vault_authority, _vault_authority_bump) =
            Pubkey::find_program_address(&[GARDEN_PDA_SEED], ctx.program_id);

        let garden_account = &mut ctx.accounts.garden_account;

        // get next available
        let mut next_available = 0;

        for i in 0..12 {
            if garden_account.grid[i] == anchor_lang::system_program::ID {
                break;
            } else {
                next_available += 1;
            }
        }
        for i in 0..12 {
            if garden_account.positions[i] == position {
                // exit early since we already have a nft in that position
                return Ok(());
            }
        }

        garden_account.grid[next_available] = *ctx.accounts.mint.to_account_info().key;
        garden_account.positions[next_available] = position;

        token::set_authority(
            ctx.accounts.into_set_authority_context(),
            AuthorityType::AccountOwner,
            Some(vault_authority),
        )?;

        token::transfer(ctx.accounts.into_transfer_to_pda_context(), 1)?;

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(vault_account_bump: u8)]
pub struct Initialize<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub initializer: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        seeds = [b"token-seed".as_ref(), &mint.key().to_bytes()],
        bump,
        payer = initializer,
        token::mint = mint,
        token::authority = initializer,
    )]
    pub vault_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,
    // pub initializer_receive_token_account: Account<'info, TokenAccount>,
    #[account(zero)]
    pub garden_account: Account<'info, GardenAccount>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_program: AccountInfo<'info>,
}

#[derive(Accounts)]
#[instruction(vault_account_bump: u8)]
pub struct Plant<'info> {
    /// CHECK: This is not dangerous because we don't read or write from this account
    #[account(mut, signer)]
    pub initializer: AccountInfo<'info>,
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        seeds = [b"token-seed".as_ref(), &mint.key().to_bytes()],
        bump,
        payer = initializer,
        token::mint = mint,
        token::authority = initializer,
    )]
    pub vault_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub initializer_deposit_token_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub garden_account: Account<'info, GardenAccount>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub system_program: AccountInfo<'info>,
    pub rent: Sysvar<'info, Rent>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub token_program: AccountInfo<'info>,
}

#[account]
pub struct GardenAccount {
    pub grid: [Pubkey; 12],
    pub positions: [u8; 12],
}

impl<'info> Initialize<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .initializer_deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.initializer.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.initializer.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}

impl<'info> Plant<'info> {
    fn into_transfer_to_pda_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        let cpi_accounts = Transfer {
            from: self
                .initializer_deposit_token_account
                .to_account_info()
                .clone(),
            to: self.vault_account.to_account_info().clone(),
            authority: self.initializer.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }

    fn into_set_authority_context(&self) -> CpiContext<'_, '_, '_, 'info, SetAuthority<'info>> {
        let cpi_accounts = SetAuthority {
            account_or_mint: self.vault_account.to_account_info().clone(),
            current_authority: self.initializer.clone(),
        };
        CpiContext::new(self.token_program.clone(), cpi_accounts)
    }
}
