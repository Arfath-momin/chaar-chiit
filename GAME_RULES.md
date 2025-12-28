# Chaar Chitti - Game Rules Quick Reference

## Objective
**Be the first player to PASS a card and then declare SET with 4 identical cards.**

---

## Setup
- **Players**: 3-10 players per game
- **Cards**: Each player always holds exactly 4 cards
- **Categories**: Apple 🍎, Mango 🥭, Banana 🍌, Orange 🍊, Grape 🍇, Pineapple 🍍

---

## Game Flow

### 1️⃣ Lobby Phase
- Join a room using a 6-character room code
- Wait for at least 3 players to join
- Any player can start the game

### 2️⃣ Distribution Phase (Instant)
- Server deals 4 cards to each player
- Cards are shuffled server-side for fairness

### 3️⃣ Pass Phase (30 seconds)
**This is where the game is played!**

#### What to do:
1. **Select a card** you want to pass (tap/click on it)
2. **Click PASS** button
3. Your selected card goes to the next player (clockwise)
4. You receive a card from the previous player

#### Critical Rule: PASS BEFORE SET
- ❌ You **CANNOT** declare SET until you've passed a card
- ✅ Only **AFTER** passing, if you have 4 identical cards, the SET button appears

#### Auto-Pass Rule:
- If you don't pass within 30 seconds, the server automatically passes your **top card** (first one)
- This prevents the game from getting stuck

#### SET Declaration:
- Once you've passed and have 4 identical cards, click **DECLARE SET**
- **First valid SET wins the round!**
- All other players immediately move to Hand Stack Phase

### 4️⃣ Hand Stack Phase (10 seconds)
**Quick reflexes matter here!**

- The SET winner gets **1st place** automatically (1000 points)
- Everyone else must **click HAND** as fast as possible
- Your position is determined by **timestamp order** (server-authoritative)
- If you don't click HAND in time, you get the last position

### 5️⃣ Round End (5 seconds)
- Scores are displayed
- Points awarded based on position:
  - 🥇 1st: 1000 points
  - 🥈 2nd: 500 points
  - 🥉 3rd: 400 points
  - 4th: 300 points
  - 5th: 200 points
  - 6th: 100 points
- Next round starts automatically

---

## Scoring

| Position | Points |
|----------|--------|
| 1st (SET winner) | 1000 |
| 2nd | 500 |
| 3rd | 400 |
| 4th | 300 |
| 5th | 200 |
| 6th | 100 |

**Total Score**: Sum of all round scores

---

## Strategy Tips

### 🎯 Goal
- Collect 4 cards of the **same category**
- Pass quickly to avoid auto-pass
- Declare SET immediately when you can

### 🧠 Strategy
1. **Know what you need**: Track which category you're collecting
2. **Pass strategically**: Give away cards you don't want
3. **Speed matters**: The first to SET wins the round
4. **Hand reactions**: After someone declares SET, click HAND fast!

### ⚠️ Common Mistakes
- ❌ Trying to declare SET before passing (server will reject)
- ❌ Taking too long to pass (auto-pass penalty)
- ❌ Not clicking HAND quickly enough (lower position)

---

## Game Rules Enforcement

All rules are **server-authoritative**. The server is the single source of truth.

### What the Server Checks:
- ✅ Has player passed before declaring SET?
- ✅ Does player have exactly 4 cards?
- ✅ Are all 4 cards identical?
- ✅ Has SET already been declared by someone else?
- ✅ Is player clicking HAND during the correct phase?

### What You'll See If You Break the Rules:
- 🚫 "You must pass before declaring SET"
- 🚫 "You have already passed"
- 🚫 "Cards are not identical"
- 🚫 "SET already declared"
- 🚫 "Not in pass phase"

---

## Example Round

### Setup
- **Players**: Alice, Bob, Charlie
- **Alice's cards**: 🍎🍎🍊🍌
- **Bob's cards**: 🍇🍎🍇🥭
- **Charlie's cards**: 🍌🍊🍊🍇

### Round Play

**Second 0-5**: Distribution complete, timer starts at 30s

**Second 7**: Alice passes 🍊 to Bob, receives 🍇 from Charlie
- Alice now has: 🍎🍎🍌🍇

**Second 9**: Bob passes 🥭 to Charlie, receives 🍊 from Alice
- Bob now has: 🍇🍎🍇🍊

**Second 11**: Charlie passes 🍌 to Alice, receives 🥭 from Bob
- Charlie now has: 🍊🍊🍇🥭

**Second 14**: Alice passes 🍇 to Bob, receives 🍌 from Charlie
- Alice now has: 🍎🍎🍌🍌

**Second 16**: Bob passes 🍊 to Charlie, receives 🍇 from Alice
- Bob now has: 🍇🍎🍇🍇 (3 Grapes!)

**Second 18**: Charlie passes 🥭 to Alice, receives 🍊 from Bob
- Charlie now has: 🍊🍊🍇🍊 (3 Oranges!)

**Second 20**: Alice passes 🍌 to Bob, receives 🥭 from Charlie
- Alice now has: 🍎🍎🍌🥭

**Second 22**: Bob passes 🍎 to Charlie, receives 🍌 from Alice
- Bob now has: 🍇🍇🍇🍌 (3 Grapes!)

**Second 24**: Charlie passes 🍇 to Alice, receives 🍎 from Bob
- Charlie now has: 🍊🍊🍊🍎 (3 Oranges!)

**Second 26**: Alice passes 🥭 to Bob, receives 🍇 from Charlie
- Alice now has: 🍎🍎🍌🍇

**Second 28**: Bob passes 🍌 to Charlie, receives 🥭 from Alice
- Bob now has: 🍇🍇🍇🥭 (3 Grapes!)

**Second 29**: Charlie passes 🍎 to Alice, receives 🍌 from Bob
- **Charlie now has: 🍊🍊🍊🍌** (Damn! Lost the 4th Orange)

**Second 30**: AUTO-PASS! Alice and Bob haven't passed yet, so:
- Alice auto-passes 🍎 (top card) to Bob
- Bob auto-passes 🍇 (top card) to Charlie

**Final hands**:
- Alice: 🍎🍌🍇
- Bob: 🍇🍇🥭🍎
- Charlie: 🍊🍊🍊🍌🍇

**Result**: No one got SET! Round restarts.

---

## Winning Example

**Second 15**: After multiple passes...
- Bob has: 🍇🍇🍇🍇 (4 Grapes!)
- Bob has already passed this round
- **SET button appears for Bob**

**Second 16**: Bob clicks **DECLARE SET** ⭐
- Bob wins 1st place (1000 points)
- **HAND buttons appear for Alice and Charlie**

**Second 17**: 
- Alice clicks HAND → 2nd place (500 points)

**Second 19**:
- Charlie clicks HAND → 3rd place (400 points)

**Final Scores This Round**:
- 🥇 Bob: 1000 points
- 🥈 Alice: 500 points
- 🥉 Charlie: 400 points

---

## Frequently Asked Questions

### Q: Can I declare SET before passing?
**A**: No! You must pass a card first. This is a core rule of the game.

### Q: What happens if I don't pass in time?
**A**: The server auto-passes your top card (index 0) automatically.

### Q: Can multiple people declare SET?
**A**: No. The first valid SET wins. Others are locked out immediately.

### Q: What if I disconnect during a game?
**A**: You're marked as disconnected. In the lobby, you're removed. During the game, the game continues without you.

### Q: Is there a maximum number of rounds?
**A**: No, the game continues until players leave the room.

### Q: Can I see other players' cards?
**A**: No. Only you can see your own cards. The server enforces this for fairness.

---

## Quick Tips for New Players

1. ✅ **Read the timer**: You have 30 seconds to pass
2. ✅ **Pass first, SET second**: Always pass before trying to SET
3. ✅ **Be quick with HAND**: Faster clicks = better position
4. ✅ **Focus on one category**: Don't keep random cards
5. ✅ **Practice makes perfect**: Play a few rounds to get the hang of it

---

**Ready to play? Join a room and start your first game!** 🎮

**Good luck and have fun! 🎉**
