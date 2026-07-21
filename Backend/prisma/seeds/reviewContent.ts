/** Content pools for prisma/seedReviews.ts — kept separate so the seeder
 *  itself stays readable. Deliberately templated + combinable rather than
 *  a fixed list of sentences, so 1,000+ reviews don't read as copy-paste. */

export const REVIEWER_FIRST_NAMES = [
  'Aarav', 'Sujata', 'Bibek', 'Nisha', 'Prakash', 'Sunita', 'Rajesh', 'Anita',
  'Kiran', 'Sabina', 'Suresh', 'Puja', 'Ramesh', 'Sarita', 'Deepak', 'Rekha',
  'Anish', 'Manisha', 'Bikash', 'Sabnam', 'Nabin', 'Sneha', 'Sandip', 'Rina',
  'Ashok', 'Bandana', 'Rabin', 'Kabita', 'Sujan', 'Alina', 'Milan', 'Roshni',
  'Dipesh', 'Pratima', 'Saroj', 'Namrata', 'Bishal', 'Anjali', 'Hari', 'Sarita',
  'Maya', 'Kishor', 'Sita', 'Ganesh', 'Radha',
] as const;

export const REVIEWER_LAST_NAMES = [
  'Sharma', 'Shrestha', 'Gurung', 'Tamang', 'Rai', 'Thapa', 'Basnet', 'Karki',
  'Adhikari', 'Poudel', 'Maharjan', 'Khadka', 'Bhattarai', 'Acharya', 'Magar',
  'Limbu', 'Chhetri', 'Joshi', 'Pandey', 'KC',
] as const;

/** [rating, weight] — skews positive, the way real storefront ratings do. */
export const RATING_WEIGHTS: [number, number][] = [
  [5, 45], [4, 28], [3, 14], [2, 8], [1, 5],
];

const POSITIVE_TITLES = [
  'Exceeded my expectations', 'Exactly as pictured', 'Great quality for the price',
  'Will definitely buy again', 'Perfect fit', 'Love this so much', 'Worth every rupee',
  'Fast delivery, great product', 'Better than I expected', 'My new favourite',
];
const NEUTRAL_TITLES = [
  'Decent, does the job', 'Good but not amazing', 'Pretty average', 'It\'s okay',
  'Fair for the price', 'Meets basic expectations', 'Reasonable purchase',
];
const NEGATIVE_TITLES = [
  'Disappointed with the quality', 'Not what I expected', 'Wouldn\'t recommend',
  'Sizing runs off', 'Expected better for the price', 'Had some issues',
];

const POSITIVE_OPENERS = [
  'Absolutely love this {name}.', 'This {name} is fantastic.', 'Really happy with this {name}.',
  'This {name} exceeded my expectations.', 'Couldn\'t be happier with this {name}.',
];
const NEUTRAL_OPENERS = [
  'This {name} is decent overall.', 'The {name} is okay for the price.', 'A fairly average {name}.',
  'The {name} does what it\'s supposed to.',
];
const NEGATIVE_OPENERS = [
  'Not too happy with this {name}.', 'The {name} didn\'t quite meet my expectations.',
  'Had a few issues with this {name}.', 'Underwhelmed by this {name}.',
];

const QUALITY_NOTES_POS = [
  'The fabric quality is excellent and feels premium.',
  'Stitching is neat and it feels well made.',
  'Material feels durable and comfortable against the skin.',
  'Color is true to the photos on the site.',
  'Packaging was great and it arrived in perfect condition.',
];
const QUALITY_NOTES_NEU = [
  'Fabric is okay, nothing special but not bad either.',
  'Stitching is fine, though a couple of loose threads.',
  'Color is slightly different from the photos but acceptable.',
  'Packaging was standard.',
];
const QUALITY_NOTES_NEG = [
  'Fabric feels thinner than expected.',
  'A couple of loose threads on arrival.',
  'Color was noticeably different from the product photos.',
  'Stitching came a little undone after a few washes.',
];

const FIT_NOTES_POS = [
  'Fits true to size, would recommend ordering your usual size.',
  'The fit is spot on and very comfortable for daily wear.',
  'Sizing chart was accurate — no surprises.',
];
const FIT_NOTES_NEU = [
  'Fit is slightly loose but still wearable.',
  'Runs a little large, might size down next time.',
  'Fit is okay, not perfect but wearable.',
];
const FIT_NOTES_NEG = [
  'Runs noticeably smaller than the size chart suggests.',
  'Fit was disappointing — had to exchange for a different size.',
  'Sizing seems inconsistent with the listed measurements.',
];

const CLOSERS_POS = [
  'Highly recommend to anyone considering this.',
  'Will be ordering more colours soon.',
  'Great addition to my wardrobe.',
  'Five stars, no complaints at all.',
];
const CLOSERS_NEU = [
  'Might consider other options next time.',
  'Not bad, but there\'s room for improvement.',
  'Would consider buying again if on sale.',
];
const CLOSERS_NEG = [
  'Probably won\'t be repurchasing this one.',
  'Hoping quality improves in future batches.',
  'Would think twice before buying again.',
];

const ADMIN_REPLIES = [
  'Thank you for sharing your feedback! We\'re glad you loved it.',
  'We appreciate your review and are sorry to hear about the sizing issue — our support team will reach out.',
  'Thanks for the honest feedback, we\'re taking note of the quality concerns you raised.',
  'So happy this worked out for you! Thanks for shopping with us.',
  'We\'re sorry this didn\'t meet expectations — please reach out to support for an exchange.',
];

const pickOne = <T>(pool: readonly T[], seed: number): T => pool[seed % pool.length];

export interface GeneratedReviewText {
  title: string;
  comment: string;
}

/** Builds a title + multi-sentence comment from templated fragments, keyed
 *  off the rating tier and a seed so output varies without being random
 *  (reproducible re-runs, same spirit as seedCatalog.ts's `pick`). */
export function buildReviewText(productName: string, rating: number, seed: number): GeneratedReviewText {
  const tier = rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative';
  const titles = tier === 'positive' ? POSITIVE_TITLES : tier === 'neutral' ? NEUTRAL_TITLES : NEGATIVE_TITLES;
  const openers = tier === 'positive' ? POSITIVE_OPENERS : tier === 'neutral' ? NEUTRAL_OPENERS : NEGATIVE_OPENERS;
  const qualityNotes = tier === 'positive' ? QUALITY_NOTES_POS : tier === 'neutral' ? QUALITY_NOTES_NEU : QUALITY_NOTES_NEG;
  const fitNotes = tier === 'positive' ? FIT_NOTES_POS : tier === 'neutral' ? FIT_NOTES_NEU : FIT_NOTES_NEG;
  const closers = tier === 'positive' ? CLOSERS_POS : tier === 'neutral' ? CLOSERS_NEU : CLOSERS_NEG;

  const shortName = productName.split(' ').slice(-2).join(' ').toLowerCase();
  const opener = pickOne(openers, seed).replace('{name}', shortName);
  const quality = pickOne(qualityNotes, seed + 3);
  const fit = pickOne(fitNotes, seed + 7);
  const closer = pickOne(closers, seed + 11);

  return {
    title: pickOne(titles, seed + 1),
    comment: `${opener} ${quality} ${fit} ${closer}`,
  };
}

export function pickAdminReply(seed: number): string {
  return pickOne(ADMIN_REPLIES, seed);
}
