# Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict Room ID Format**: Every room document ID (`{roomId}`) must be a valid 5-character uppercase alphanumeric code (`^[A-Z0-9]{5}$`) and match `incoming().roomCode`.
2. **Host Identity Integrity**: A room can only be created by an authenticated, email-verified user whose `request.auth.uid` matches `incoming().hostUid`.
3. **Immutable Host & Creation Timestamp**: `hostUid`, `roomCode`, and `createdAt` can never be modified after room creation.
4. **Strict Key & Size Enforcement**: Every string field has explicit `.size()` bounds (`question_text.size() <= 300`, `current_turn in ['player1', 'player2']`, `game_status in ['waiting', 'playing', 'completed']`). No shadow/undeclared keys are permitted (`hasOnly`).
5. **Terminal State Locking**: Once `existing().game_status == 'completed'`, no further updates are permitted.
6. **Temporal Integrity**: `createdAt` on create and `updatedAt` on create/update must equal `request.time`.
7. **No Blanket List**: `allow list` is restricted strictly to rooms where `resource.data.hostUid == request.auth.uid || resource.data.guestUid == request.auth.uid`.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Create**: Creating `/rooms/ABCDE` with `request.auth == null` -> `PERMISSION_DENIED`.
2. **Unverified Email Create**: Creating `/rooms/ABCDE` with `request.auth.token.email_verified == false` -> `PERMISSION_DENIED`.
3. **Host Spoofing on Create**: Creating `/rooms/ABCDE` where `hostUid != request.auth.uid` -> `PERMISSION_DENIED`.
4. **Shadow Field Injection on Create**: Creating `/rooms/ABCDE` with extra field `isAdmin: true` -> `PERMISSION_DENIED`.
5. **ID Poisoning**: Creating `/rooms/invalid_long_id_12345` that violates `^[A-Z0-9]{5}$` -> `PERMISSION_DENIED`.
6. **Oversized Prompt Payload (Denial of Wallet)**: Updating `question_text` with a 5,000-character string -> `PERMISSION_DENIED`.
7. **Forged Client Timestamp**: Creating or updating a room where `updatedAt != request.time` -> `PERMISSION_DENIED`.
8. **Host Takeover on Update**: Player 2 attempting to change `hostUid` during an update -> `PERMISSION_DENIED`.
9. **Terminal State Bypass**: Updating a room whose `existing().game_status == 'completed'` -> `PERMISSION_DENIED`.
10. **Unauthorized Third-Party Update**: A user who is neither `hostUid` nor `guestUid` attempting to update an active room -> `PERMISSION_DENIED`.
11. **Invalid Enum State**: Setting `current_turn` to `"player3"` or `game_status` to `"hacked"` -> `PERMISSION_DENIED`.
12. **Blanket Collection Scraping**: Listing `/rooms` without filtering by `hostUid` or `guestUid` -> `PERMISSION_DENIED`.
