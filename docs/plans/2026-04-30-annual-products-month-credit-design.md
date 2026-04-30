# Annual Products Month Credit Design

## Goal

Keep the existing two subscription products and add Basic Annual and Pro Annual products. Upgrades must support cross-interval targets and charge only the business-defined monthly remaining value difference.

## Product Model

`Product` remains the app's business product record. `ProductPlatform` remains the Stripe mapping for the Stripe product and price used to sell that product.

The product catalog will contain four entries:

- Basic Plan, existing Stripe configuration, level 1
- Pro Plan, existing Stripe configuration, level 2
- Basic Plan Annual, Stripe price `price_1TRnklRxCAAlii2EMOddBstc`, level 1
- Pro Plan Annual, Stripe price `price_1TRnlMRxCAAlii2EICpMtBjB`, level 2

Annual product Stripe product IDs should be resolved from Stripe Price data when the app ensures or validates the local product mapping. This avoids adding one environment variable per new Stripe product as the catalog grows.

## Upgrade Pricing

The upgrade difference uses complete months, not second-level proration.

Definitions:

- `periodMonths`: the Stripe price interval in months (`month` with `interval_count`, or `year * 12`)
- `usedCompleteMonths`: the number of full calendar months crossed since the current subscription item period start
- `remainingMonths`: `max(periodMonths - usedCompleteMonths, 0)`
- current monthly value: `current.unit_amount / current.periodMonths`
- target monthly cost: `target.unit_amount / target.periodMonths`
- upgrade amount: `(targetMonthlyCost - currentMonthlyValue) * remainingMonths`

If an annual subscription has completed 5 full months and is now in month 6, it has 7 remaining months. Basic Annual to Pro Annual therefore charges `(200 - 100) / 12 * 7`, rounded to Stripe's smallest currency unit.

## Cross-Interval Behavior

Cross-interval upgrades use the same remaining-month formula. For example, Basic monthly to Pro annual compares the monthly equivalent of each Stripe price across the current subscription period's remaining months.

The app continues to require target products to have a higher business `level`, so this remains a plan upgrade path, not a same-tier billing interval switcher. Non-positive calculated upgrade amounts are rejected as `stripe_api`, which keeps this path focused on paid upgrades instead of downgrades or free plan switches.

## Testing

Tests should cover:

- the product catalog includes all four products and the annual Stripe price IDs
- annual products can resolve Stripe product IDs from retrieved Stripe price data
- a yearly upgrade after 5 complete months leaves 7 months and charges the expected rounded difference
- cross-interval upgrades use monthly equivalents
- invalid prices, currencies, intervals, and non-positive upgrade amounts are rejected
