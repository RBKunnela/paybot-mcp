---
name: state-machine
description: State transition diagram with guards, actions, and lifecycle phases
type: template
lifecycle_phase: implementation
visual_pattern: cycle
---

# State Machine Diagram

## When to Use

- Documenting workflow states (story lifecycle, order processing, approval chains)
- Designing auth flows with session state transitions
- Modeling entity lifecycles for database status fields
- Validating that all edge cases have defined transitions
- Communicating business rules around state changes to stakeholders

## ASCII Layout

```
+-------------------------------------------------------------------+
|                          [TITLE]                                   |
|                         [SUBTITLE]                                 |
|                                                                    |
|                          (start)                                   |
|                             |                                      |
|                             v                                      |
|                    +----------------+                              |
|                    |   State A      |                              |
|                    |   [on entry]   |                              |
|                    +----------------+                              |
|                      |            |                                |
|           [guard 1]  |            | [guard 2]                     |
|                      v            v                                |
|            +-----------+    +-----------+                          |
|            |  State B  |    |  State C  |                          |
|            +-----------+    +-----------+                          |
|                 |                  |                                |
|                 |   [guard 3]     |                                |
|                 +------+----------+                                |
|                        v                                           |
|                 +-----------+                                      |
|                 |  State D  |                                      |
|                 +-----------+                                      |
|                        |                                           |
|                        v                                           |
|                     ((end))                                        |
|                                                                    |
+-------------------------------------------------------------------+
```

## Template Fields

| Field | Description | Example |
|-------|-------------|---------|
| `machine_name` | Name of the state machine | "Order Lifecycle" |
| `states` | List of named states with entry/exit actions | Draft, Submitted, Approved |
| `transitions` | Arrow from state A to state B | Draft -> Submitted |
| `guards` | Conditions that must be true for transition | [payment_valid] |
| `actions` | Side effects triggered by transition | send_confirmation_email |
| `initial_state` | Starting state | Draft |
| `final_states` | Terminal states (one or more) | Completed, Cancelled |

## Element Guidance

### Initial State (Start)
- Type: `ellipse`, width: 24, height: 24
- Fill: `#1e3a5f` (solid dark), stroke: `#1e3a5f`
- No label inside; place "start" label above or beside
- roughness: 0

### Final State (End)
- Type: `ellipse`, width: 28, height: 28 (outer), nested `ellipse` width: 18 (inner)
- Outer: fill `#ffffff`, stroke `#1e3a5f`, strokeWidth: 2
- Inner: fill `#1e3a5f`, stroke `#1e3a5f`
- Bullseye pattern; place "end" label below

### Regular States
- Type: `rectangle`, borderRadius: 12 (rounded)
- Fill: `#3b82f6` (primary), stroke: `#1e3a5f`, strokeWidth: 2
- Label: state name in bold, entry/exit actions in smaller text below
- roughness: 0

### Decision / Conditional States
- Type: `diamond` or `rectangle` with borderRadius: 12
- Fill: `#fef3c7` (decision), stroke: `#b45309`, strokeWidth: 2
- Use when a state branches based on a condition

### Success / Terminal States
- Type: `rectangle`, borderRadius: 12
- Fill: `#a7f3d0` (success), stroke: `#047857`
- For error terminals: fill `#fecaca`, stroke `#b91c1c`

### Transition Arrows
- Type: `arrow`, stroke: `#64748b`, strokeWidth: 2
- Label format: `[guard] / action`
- Guard in square brackets, action after slash
- For conditional branches, use decision color `#b45309` on the label

### Self-Transitions (Loops)
- Type: `arrow` curving back to same state
- Label with guard and action as usual
- Place loop arrow on right or top side of the state

### Title
- fontSize: 28, fontFamily: 3, color: `#1e40af`

### Subtitle
- fontSize: 16, fontFamily: 1, color: `#3b82f6`

## Example: Order Lifecycle

```
Title: "Order Lifecycle"
Subtitle: "From cart to delivery with cancellation paths"

(start) --> "Draft" (primary)
  entry: initialize_cart()

"Draft" --[items_added]--> "Pending Payment" (primary)

"Pending Payment" --[payment_success]--> "Confirmed" (success)
  action: send_confirmation_email()

"Pending Payment" --[payment_failed]--> "Payment Failed" (error)
  action: notify_user()

"Payment Failed" --[retry]--> "Pending Payment" (primary)
"Payment Failed" --[max_retries]--> "Cancelled" (error terminal)

"Confirmed" --[shipped]--> "In Transit" (primary)
  action: generate_tracking()

"In Transit" --[delivered]--> "Completed" (success terminal)
  action: request_review()

"Confirmed" --[user_cancel && not_shipped]--> "Cancelled" (error terminal)
  action: process_refund()

"Draft" --[abandoned_48h]--> "Expired" (warning #fee2e2)

((end)) after: Completed, Cancelled, Expired
```
