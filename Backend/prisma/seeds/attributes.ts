/** Shared attribute pools the catalog generator draws from — kept separate
 *  from categoryTree.ts so taxonomy and vocabulary can evolve independently. */

export const COLORS: { name: string; hexCode: string }[] = [
  { name: 'Black', hexCode: '#000000' },
  { name: 'White', hexCode: '#FFFFFF' },
  { name: 'Navy', hexCode: '#1F2A44' },
  { name: 'Beige', hexCode: '#E8DFC8' },
  { name: 'Olive', hexCode: '#6B6E3A' },
  { name: 'Burgundy', hexCode: '#6D1E30' },
  { name: 'Blush Pink', hexCode: '#F3C4C6' },
  { name: 'Charcoal Grey', hexCode: '#3B3B3D' },
  { name: 'Camel', hexCode: '#C19A6B' },
  { name: 'Ivory', hexCode: '#FAF3E7' },
  { name: 'Mustard', hexCode: '#D9A441' },
  { name: 'Emerald Green', hexCode: '#0F6B4F' },
  { name: 'Rust Orange', hexCode: '#B4552B' },
  { name: 'Dusty Rose', hexCode: '#C98A94' },
  { name: 'Sage Green', hexCode: '#9CAF88' },
  { name: 'Cobalt Blue', hexCode: '#1E4FA3' },
  { name: 'Lavender', hexCode: '#B9A6D9' },
  { name: 'Terracotta', hexCode: '#C1673A' },
  { name: 'Chocolate Brown', hexCode: '#4A2E1F' },
  { name: 'Champagne Gold', hexCode: '#D9C48C' },
];

export const MATERIALS = [
  'Cotton', 'Polyester Blend', 'Linen', 'Silk', 'Wool', 'Denim', 'Rayon', 'Viscose',
  'Chiffon', 'Georgette', 'Velvet', 'Genuine Leather', 'Suede', 'Cashmere Blend',
  'Modal', 'Spandex Blend', 'Corduroy', 'Satin', 'Jersey Knit', 'Fleece',
];

export const FITS = ['Slim Fit', 'Regular Fit', 'Relaxed Fit', 'Oversized Fit', 'Tailored Fit', 'Loose Fit'];

export const PATTERNS = [
  'Solid', 'Striped', 'Floral', 'Polka Dot', 'Checked', 'Printed', 'Embroidered', 'Textured', 'Color-block',
];

export const SLEEVE_TYPES = ['Full Sleeve', 'Half Sleeve', 'Sleeveless', 'Cap Sleeve', 'Puff Sleeve', 'Bell Sleeve', 'Raglan Sleeve'];

export const NECKLINES = ['Round Neck', 'V-Neck', 'Boat Neck', 'Halter Neck', 'Off-Shoulder', 'Collared', 'Turtleneck', 'Square Neck'];

export const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter', 'All-Season'];

export const WEATHER = ['Hot Weather', 'Mild Weather', 'Cold Weather', 'Rainy Weather', 'Any Weather'];

export const OCCASIONS = [
  'Casual Outing', 'Work', 'Party', 'Wedding', 'Festive', 'Vacation', 'Everyday', 'Date Night', 'Sports', 'Lounging',
];

export const DRESS_CODES = ['Casual', 'Smart Casual', 'Business Casual', 'Formal', 'Black Tie'];

export const STYLE_AESTHETICS = [
  'Minimalist', 'Streetwear', 'Elegant', 'Casual', 'Formal', 'Bohemian', 'Vintage',
  'Korean', 'Business Casual', 'Preppy', 'Athleisure',
];

export const BODY_TYPES = ['Pear', 'Apple', 'Hourglass', 'Rectangle', 'Inverted Triangle', 'All Body Types'];

export const AGE_GROUPS = ['Teen', 'Young Adult', 'Adult', 'All Ages'];

export const GENDERS = ['Women', 'Men', 'Unisex'];

export const COUNTRIES_OF_ORIGIN = ['Nepal', 'India', 'Bangladesh', 'China', 'Vietnam', 'Turkey'];

export const APPAREL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
export const SHOE_SIZES = ['6', '7', '8', '9', '10', '11'];
export const ONE_SIZE = ['One Size'];

/** Per top-level category: which size set applies, whether sleeve/neckline
 *  characteristics make sense, price tier (NPR), and default season/occasion
 *  hints layered onto each generated product. */
export interface CategoryProfile {
  sizes: string[];
  hasSleeveNeckline: boolean;
  priceMin: number;
  priceMax: number;
  defaultSeasons: string[];
  defaultOccasions: string[];
  defaultGenders: string[];
}

export const CATEGORY_PROFILES: Record<string, CategoryProfile> = {
  'Tops': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 800, priceMax: 3500, defaultSeasons: ['All-Season'], defaultOccasions: ['Everyday', 'Casual Outing'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Bottoms': { sizes: APPAREL_SIZES, hasSleeveNeckline: false, priceMin: 1000, priceMax: 4000, defaultSeasons: ['All-Season'], defaultOccasions: ['Everyday', 'Casual Outing'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Dresses': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 1500, priceMax: 8000, defaultSeasons: ['Spring', 'Summer'], defaultOccasions: ['Party', 'Date Night'], defaultGenders: ['Women'] },
  'Outerwear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 2500, priceMax: 12000, defaultSeasons: ['Autumn', 'Winter'], defaultOccasions: ['Work', 'Everyday'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Traditional Wear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 3000, priceMax: 25000, defaultSeasons: ['All-Season'], defaultOccasions: ['Festive', 'Wedding'], defaultGenders: ['Women', 'Men'] },
  'Footwear': { sizes: SHOE_SIZES, hasSleeveNeckline: false, priceMin: 1500, priceMax: 9000, defaultSeasons: ['All-Season'], defaultOccasions: ['Everyday', 'Work'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Bags': { sizes: ONE_SIZE, hasSleeveNeckline: false, priceMin: 1200, priceMax: 15000, defaultSeasons: ['All-Season'], defaultOccasions: ['Everyday', 'Work'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Accessories': { sizes: ONE_SIZE, hasSleeveNeckline: false, priceMin: 400, priceMax: 3500, defaultSeasons: ['All-Season'], defaultOccasions: ['Everyday'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Jewelry': { sizes: ONE_SIZE, hasSleeveNeckline: false, priceMin: 500, priceMax: 20000, defaultSeasons: ['All-Season'], defaultOccasions: ['Party', 'Wedding', 'Everyday'], defaultGenders: ['Women'] },
  'Activewear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 900, priceMax: 5000, defaultSeasons: ['All-Season'], defaultOccasions: ['Sports'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Formal Wear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 3500, priceMax: 20000, defaultSeasons: ['All-Season'], defaultOccasions: ['Work', 'Wedding'], defaultGenders: ['Women', 'Men'] },
  'Casual Wear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 900, priceMax: 4500, defaultSeasons: ['All-Season'], defaultOccasions: ['Everyday', 'Casual Outing'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Party Wear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 2500, priceMax: 15000, defaultSeasons: ['All-Season'], defaultOccasions: ['Party', 'Date Night'], defaultGenders: ['Women'] },
  'Winter Wear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 1800, priceMax: 12000, defaultSeasons: ['Winter'], defaultOccasions: ['Everyday'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Summer Wear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 900, priceMax: 4500, defaultSeasons: ['Summer'], defaultOccasions: ['Vacation', 'Casual Outing'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Sleepwear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 800, priceMax: 3500, defaultSeasons: ['All-Season'], defaultOccasions: ['Lounging'], defaultGenders: ['Women', 'Men', 'Unisex'] },
  'Ethnic Wear': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 2500, priceMax: 18000, defaultSeasons: ['All-Season'], defaultOccasions: ['Festive', 'Wedding'], defaultGenders: ['Women', 'Men'] },
  'Layering Pieces': { sizes: APPAREL_SIZES, hasSleeveNeckline: true, priceMin: 1200, priceMax: 6000, defaultSeasons: ['Spring', 'Autumn'], defaultOccasions: ['Everyday', 'Casual Outing'], defaultGenders: ['Women', 'Unisex'] },
};
