use anchor_lang::prelude::*;

declare_id!("84EH2DYEyYxWg7DHhL2mEoNP1r8PaDhRsRjLrsxbFYRy");

#[program]
pub mod message_capsule {
    use super::*;

    pub fn create_capsule(ctx: Context<CreateCapsule>, message: String) -> Result<()> {
        let capsule = &mut ctx.accounts.capsule;
        capsule.message = message;
        capsule.created_time = Clock::get().unwrap().unix_timestamp;
        capsule.unlock_duration = 60; // 60 seconds lock
        Ok(())
    }

    pub fn read_message(ctx: Context<ReadMessage>) -> Result<String> {
        let capsule = &ctx.accounts.capsule;
        let current_time = Clock::get().unwrap().unix_timestamp;
        
        require!(
            current_time >= capsule.created_time + capsule.unlock_duration,
            MessageCapsuleError::TooEarlyToRead
        );
        
        msg!("Your message: {}", capsule.message);
        Ok(capsule.message.clone())
    }
}

#[derive(Accounts)]
pub struct CreateCapsule<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 32 + 4 + 200 + 8 + 8  // discriminator + pubkey + string prefix + max message length + timestamps
    )]
    pub capsule: Account<'info, MessageCapsule>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ReadMessage<'info> {
    #[account(mut)]
    pub capsule: Account<'info, MessageCapsule>,
}

#[account]
pub struct MessageCapsule {
    pub message: String,
    pub created_time: i64,
    pub unlock_duration: i64,
}

#[error_code]
pub enum MessageCapsuleError {
    #[msg("Too early to read the message")]
    TooEarlyToRead,
}