# Revenue baseline diagnostic — recovered evidence

## Evidence date
Historical Stan analytics snapshot captured 2026-07-13 for the range **Jul 1, 2026 – Jul 13, 2026**. This is a recovered baseline, not a claim about current September performance.

## Verified funnel snapshot
- Store visits: **185**
- Total revenue: **$35**
- Leads: **8**
- Traffic sources: TikTok **138**, Other **44**, Google **3**, beacons.ai **1**
- Cover Letter Template That Gets Read: **22 product views, 5 orders, 22.7% conversion, $35 revenue**
- Career Journey MVP: **8 product views, 1 order shown, 12.5% conversion, revenue shown as "-"**
- Inner Vue: **3 product views, no order shown**
- Organize Your Life Planner: **1 product view, no order shown**
- Free ebook / other free resource rows showed activity but no revenue.

## Derived diagnostic ratios
Using the verified snapshot:
- visitor → lead: 8 / 185 = **4.3%**
- reported revenue per store visit: $35 / 185 = **$0.19**
- TikTok share of store visits: 138 / 185 = **74.6%**
- cover-letter product-view share of visits: 22 / 185 = **11.9%**
- Career Journey MVP product-view share of visits: 8 / 185 = **4.3%**

## Evidence-based diagnosis
The strongest verified constraint in this historical baseline is **qualified traffic reaching the monetized offers and progressing into measurable paid conversion**, not absence of content production.

Why:
1. Traffic existed, but only a small fraction reached the two principal monetized product pages.
2. TikTok supplied roughly three quarters of store visits, creating concentration risk and making traffic quality important.
3. The $7 cover-letter offer converted strongly once viewed (22.7%), suggesting that offer itself was not the first bottleneck in this snapshot.
4. Career Journey MVP had only eight product views. The sample is too small to make a confident claim about its true conversion rate.
5. Revenue remained $35 while visits continued to rise in later checks, showing incremental attention without corresponding revenue growth.

## Measurement caveat
Stan displayed one Career Journey MVP order but no revenue in the recovered table. Do not count that row as verified paid revenue without reconciling whether it was a test, comped/free order, reporting lag, refund, or another condition. Analytics must reconcile this before using it in revenue totals.

## Immediate executive assignments
### VP Revenue — accountable owner
Reconcile offer-path economics and identify why store visitors are not reaching monetized product pages at a higher rate. Treat the $7 cover-letter offer as a potentially useful entry offer, but do not change pricing without CEO approval.

### Analytics
Establish a current dated baseline using the same definitions: visits, sources, leads, product views, orders, paid revenue, refunds, and attributable conversions. Explicitly reconcile the Career Journey MVP order/revenue mismatch.

### Marketing + Community
Diagnose whether traffic being sent to Stan is qualified buyer-intent traffic. Preserve source/UTM attribution and capture repeated objections/questions. Do not respond to weak conversion by simply increasing posting volume.

### Automation
Do not restore high-frequency social/content workflows yet. First restore/verify low-cost measurement and event-driven follow-up needed to observe this funnel. Safeguards remain mandatory.

## Decision gate before scaling automation
Do not scale acquisition or n8n execution until CJGE can answer:
1. What is the current visitor → product-view rate by offer?
2. What is the current product-view → paid-order rate?
3. Which sources create paid buyers, not merely visits?
4. Are leads receiving measurable follow-up?
5. Can paid revenue be reconciled to orders/refunds?

After those are known, automate the highest-confidence bottleneck rather than the highest-volume activity.
