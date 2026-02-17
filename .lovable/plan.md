

# Stripe Billing: Usage-Based Credits System

## Overview
Every new user gets 20 free credits on signup. Each "Generate Ideas" or "Validate Idea" action costs 1 credit. When credits run out, a paywall appears to buy more via Stripe.

## How It Works

1. **Signup** -- User gets 20 free credits automatically
2. **Usage** -- Generate Ideas = 1 credit, Validate Idea = 1 credit, Follow-up chat = free
3. **Paywall** -- When credits hit 0, a modal blocks the action and shows purchase options
4. **Purchase** -- User buys a credit pack via Stripe Checkout, credits are added instantly

## Credit Packs

| Pack | Credits | Price |
|------|---------|-------|
| Starter | 10 | $5 |
| Pro | 50 | $20 |
| Power | 100 | $35 |

## Implementation Steps

### Step 1: Enable Stripe
Connect Stripe to the project using the Lovable Stripe integration.

### Step 2: Database Migration
Add a `credits` column to the `profiles` table with a default of 20. The existing signup trigger already creates a profile row, so new users will automatically get 20 credits.

```sql
ALTER TABLE profiles ADD COLUMN credits integer NOT NULL DEFAULT 20;
```

### Step 3: Create `useCredits` Hook
A React hook that:
- Fetches the user's current credit balance from `profiles`
- Provides `deductCredit()` -- decrements by 1 and updates the DB
- Provides `refreshCredits()` -- re-fetches after purchase
- Exposes `hasCredits` boolean for gating actions

### Step 4: Create Paywall Component
A modal component (`Paywall.tsx`) that displays when credits are 0:
- Shows "You've used all your free credits"
- Lists the 3 credit pack options with prices
- Each option triggers Stripe Checkout via a backend function

### Step 5: Backend Functions

**`create-checkout` edge function:**
- Receives the selected credit pack (amount + price)
- Creates a Stripe Checkout session with the correct price
- Returns the checkout URL to redirect the user

**`stripe-webhook` edge function:**
- Listens for `checkout.session.completed` events from Stripe
- Extracts the user ID and credit amount from session metadata
- Updates the user's `credits` column in `profiles` by adding the purchased amount

### Step 6: Update Generate Ideas Page
- Before calling the AI, check `hasCredits`
- If no credits, show the Paywall modal instead
- On successful AI call, call `deductCredit()`

### Step 7: Update Validate Idea Page
- Same credit check and deduction logic as Generate Ideas

### Step 8: Show Credit Balance in Sidebar
- Display remaining credits in `AppSidebar.tsx` next to the user section
- Update in real-time after each action or purchase

### Step 9: Update Auth Context
- Include `credits` in the profile fetch query so it's available app-wide

## Flow

```text
User clicks Generate/Validate
         |
    credits > 0?
    /          \
  YES           NO
   |             |
Deduct 1    Show Paywall
   |             |
Run AI      User picks pack
               |
         Stripe Checkout
               |
         Payment success
               |
         Webhook adds credits
               |
         User retries action
```

## Files to Create
- `src/hooks/useCredits.ts`
- `src/components/Paywall.tsx`
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`

## Files to Modify
- `src/pages/GenerateIdeas.tsx` -- credit gate before AI call
- `src/pages/ValidateIdea.tsx` -- credit gate before AI call
- `src/components/AppSidebar.tsx` -- show credit count
- `src/contexts/AuthContext.tsx` -- fetch credits with profile

