/**
 * Fashion catalog category tree — 18 top-level categories, each with real
 * fashion-retail subcategories. Every subcategory name is globally unique
 * (Category.name has a uniqueness constraint enforced at the service layer),
 * so near-duplicate concepts across categories are deliberately named
 * distinctly (e.g. "Wool Sweaters" under Winter Wear vs. plain "Sweaters"
 * under Tops).
 *
 * Each subcategory carries 2 base product-name templates, consumed by
 * seedCatalog.ts's generator to produce the full product list — this file
 * only defines the taxonomy + naming, not full product records.
 */

export interface SubcategoryDef {
  name: string;
  products: string[];
}

export interface CategoryDef {
  name: string;
  subcategories: SubcategoryDef[];
}

export const CATEGORY_TREE: CategoryDef[] = [
  {
    name: 'Tops',
    subcategories: [
      { name: 'T-Shirts', products: ['Classic Crew Neck Tee', 'Graphic Print Tee', 'V-Neck Basic Tee'] },
      { name: 'Shirts', products: ['Oxford Button-Down Shirt', 'Striped Cotton Shirt'] },
      { name: 'Blouses', products: ['Silk Tie-Neck Blouse', 'Ruffle Sleeve Blouse'] },
      { name: 'Crop Tops', products: ['Ribbed Crop Top', 'Halter Crop Top'] },
      { name: 'Hoodies', products: ['Fleece Pullover Hoodie', 'Zip-Up Hoodie'] },
      { name: 'Sweaters', products: ['Cable Knit Sweater', 'Turtleneck Sweater'] },
      { name: 'Tank Tops', products: ['Ribbed Tank Top', 'Racerback Tank Top'] },
      { name: 'Polo Shirts', products: ['Classic Pique Polo', 'Slim Fit Polo Shirt'] },
      { name: 'Tunics', products: ['Embroidered Tunic Top', 'Flowy Kaftan Tunic'] },
    ],
  },
  {
    name: 'Bottoms',
    subcategories: [
      { name: 'Jeans', products: ['Slim Fit Jeans', 'High-Waist Straight Jeans', 'Bootcut Denim Jeans'] },
      { name: 'Trousers', products: ['Tapered Chino Trousers', 'Wide-Leg Trousers'] },
      { name: 'Shorts', products: ['Denim Cutoff Shorts', 'Pleated Bermuda Shorts'] },
      { name: 'Skirts', products: ['A-Line Denim Skirt', 'Pleated Mini Skirt'] },
      { name: 'Leggings', products: ['High-Waist Leggings', 'Seamless Leggings'] },
      { name: 'Cargo Pants', products: ['Utility Cargo Pants', 'Relaxed Fit Cargo Pants'] },
      { name: 'Joggers', products: ['Fleece Jogger Pants', 'Slim Tapered Joggers'] },
      { name: 'Culottes', products: ['Wide-Leg Culottes', 'Pleated Linen Culottes'] },
    ],
  },
  {
    name: 'Dresses',
    subcategories: [
      { name: 'Maxi Dresses', products: ['Floral Maxi Dress', 'Tiered Boho Maxi Dress', 'Satin Slip Maxi Dress'] },
      { name: 'Midi Dresses', products: ['Wrap Midi Dress', 'Puff Sleeve Midi Dress'] },
      { name: 'Mini Dresses', products: ['Ribbed Mini Dress', 'Slip Mini Dress'] },
      { name: 'Bodycon Dresses', products: ['Ruched Bodycon Dress', 'Off-Shoulder Bodycon Dress'] },
      { name: 'Wrap Dresses', products: ['Printed Wrap Dress', 'Faux Wrap Jersey Dress'] },
      { name: 'Shirt Dresses', products: ['Denim Shirt Dress', 'Poplin Shirt Dress'] },
      { name: 'Cocktail Dresses', products: ['Sequin Cocktail Dress', 'Lace Cocktail Dress'] },
      { name: 'Evening Gowns', products: ['Satin Evening Gown', 'Beaded Evening Gown'] },
    ],
  },
  {
    name: 'Outerwear',
    subcategories: [
      { name: 'Denim Jackets', products: ['Classic Denim Jacket', 'Oversized Denim Jacket', 'Cropped Denim Jacket'] },
      { name: 'Bomber Jackets', products: ['Satin Bomber Jacket', 'Quilted Bomber Jacket'] },
      { name: 'Blazers', products: ['Tailored Single-Breasted Blazer', 'Double-Breasted Blazer'] },
      { name: 'Trench Coats', products: ['Classic Belted Trench Coat', 'Double-Breasted Trench Coat'] },
      { name: 'Parkas', products: ['Hooded Cotton Parka', 'Utility Parka Jacket'] },
      { name: 'Windbreakers', products: ['Lightweight Windbreaker', 'Colorblock Windbreaker'] },
      { name: 'Cardigans', products: ['Longline Knit Cardigan', 'Chunky Open-Front Cardigan'] },
      { name: 'Vests', products: ['Quilted Puffer Vest', 'Tailored Suit Vest'] },
    ],
  },
  {
    name: 'Traditional Wear',
    subcategories: [
      { name: 'Kurta Sets', products: ['Embroidered Cotton Kurta Set', 'Printed Kurta Palazzo Set', 'Chikankari Kurta Set'] },
      { name: 'Sarees', products: ['Banarasi Silk Saree', 'Georgette Printed Saree'] },
      { name: 'Lehengas', products: ['Embroidered Bridal Lehenga', 'Georgette Flared Lehenga'] },
      { name: 'Salwar Suits', products: ['Anarkali Salwar Suit', 'Straight Cut Salwar Suit'] },
      { name: 'Sherwanis', products: ['Embroidered Silk Sherwani', 'Classic Brocade Sherwani'] },
      { name: 'Dhoti Pants', products: ['Traditional Cotton Dhoti Pants', 'Draped Silk Dhoti Pants'] },
      { name: 'Nehru Jackets', products: ['Brocade Nehru Jacket', 'Embroidered Velvet Nehru Jacket'] },
      { name: 'Gharara Sets', products: ['Embellished Gharara Set', 'Silk Gharara Suit'] },
    ],
  },
  {
    name: 'Footwear',
    subcategories: [
      { name: 'Sneakers', products: ['Classic Low-Top Sneakers', 'Chunky Platform Sneakers', 'High-Top Canvas Sneakers'] },
      { name: 'Sandals', products: ['Strappy Flat Sandals', 'Cushioned Slide Sandals'] },
      { name: 'Heels', products: ['Pointed Toe Stiletto Heels', 'Block Heel Sandals'] },
      { name: 'Flats', products: ['Ballet Flats', 'Pointed Toe Flats'] },
      { name: 'Boots', products: ['Ankle Chelsea Boots', 'Knee-High Riding Boots'] },
      { name: 'Loafers', products: ['Penny Loafers', 'Tassel Suede Loafers'] },
      { name: 'Slippers', products: ['Cozy Fleece Slippers', 'Memory Foam Slide Slippers'] },
      { name: 'Espadrilles', products: ['Canvas Lace-Up Espadrilles', 'Wedge Espadrille Sandals'] },
    ],
  },
  {
    name: 'Bags',
    subcategories: [
      { name: 'Tote Bags', products: ['Canvas Everyday Tote', 'Leather Structured Tote', 'Woven Straw Tote'] },
      { name: 'Backpacks', products: ['Minimalist Leather Backpack', 'Travel Nylon Backpack'] },
      { name: 'Crossbody Bags', products: ['Quilted Crossbody Bag', 'Mini Chain Crossbody Bag'] },
      { name: 'Clutches', products: ['Satin Envelope Clutch', 'Beaded Evening Clutch'] },
      { name: 'Sling Bags', products: ['Canvas Sling Bag', 'Leather Sling Bag'] },
      { name: 'Duffel Bags', products: ['Weekend Canvas Duffel Bag', 'Leather Gym Duffel Bag'] },
      { name: 'Laptop Bags', products: ['Slim Leather Laptop Bag', 'Padded Laptop Messenger Bag'] },
      { name: 'Wallets', products: ['Bifold Leather Wallet', 'Zip-Around Wallet'] },
    ],
  },
  {
    name: 'Accessories',
    subcategories: [
      { name: 'Belts', products: ['Classic Leather Belt', 'Woven Braided Belt', 'Chain Link Waist Belt'] },
      { name: 'Scarves', products: ['Silk Print Scarf', 'Cashmere Blend Scarf'] },
      { name: 'Hats', products: ['Wide Brim Fedora Hat', 'Structured Baseball Cap'] },
      { name: 'Sunglasses', products: ['Classic Aviator Sunglasses', 'Oversized Cat-Eye Sunglasses'] },
      { name: 'Gloves', products: ['Leather Touchscreen Gloves', 'Knit Wool Gloves'] },
      { name: 'Hair Accessories', products: ['Pearl Hair Clip Set', 'Satin Scrunchie Set'] },
      { name: 'Ties', products: ['Silk Textured Tie', 'Classic Striped Tie'] },
      { name: 'Pocket Squares', products: ['Printed Silk Pocket Square', 'Linen Pocket Square'] },
    ],
  },
  {
    name: 'Jewelry',
    subcategories: [
      { name: 'Necklaces', products: ['Layered Chain Necklace', 'Pendant Statement Necklace', 'Delicate Pearl Necklace'] },
      { name: 'Earrings', products: ['Gold Hoop Earrings', 'Pearl Drop Earrings'] },
      { name: 'Bracelets', products: ['Chain Link Bracelet', 'Beaded Charm Bracelet'] },
      { name: 'Rings', products: ['Stackable Band Ring Set', 'Statement Cocktail Ring'] },
      { name: 'Anklets', products: ['Beaded Charm Anklet', 'Delicate Chain Anklet'] },
      { name: 'Brooches', products: ['Vintage Floral Brooch', 'Crystal Statement Brooch'] },
      { name: 'Jewelry Sets', products: ['Bridal Jewelry Set', 'Everyday Minimalist Jewelry Set'] },
      { name: 'Nose Pins', products: ['Gold Stud Nose Pin', 'Crystal Nose Pin'] },
    ],
  },
  {
    name: 'Activewear',
    subcategories: [
      { name: 'Sports Bras', products: ['High-Impact Sports Bra', 'Seamless Racerback Sports Bra', 'Padded Strappy Sports Bra'] },
      { name: 'Track Pants', products: ['Tapered Track Pants', 'Striped Athletic Track Pants'] },
      { name: 'Gym Tights', products: ['High-Waist Gym Tights', 'Mesh Panel Gym Tights'] },
      { name: 'Athletic Shorts', products: ['Running Athletic Shorts', 'Compression Training Shorts'] },
      { name: 'Training Tops', products: ['Moisture-Wick Training Tee', 'Cropped Training Tank'] },
      { name: 'Yoga Pants', products: ['High-Waist Yoga Pants', 'Flared Yoga Pants'] },
      { name: 'Compression Wear', products: ['Compression Base Layer Top', 'Compression Leggings'] },
      { name: 'Sports Jackets', products: ['Zip-Through Track Jacket', 'Lightweight Running Jacket'] },
    ],
  },
  {
    name: 'Formal Wear',
    subcategories: [
      { name: 'Suits', products: ['Two-Piece Tailored Suit', 'Slim Fit Formal Suit', 'Three-Piece Pinstripe Suit'] },
      { name: 'Formal Shirts', products: ['Non-Iron Dress Shirt', 'French Cuff Formal Shirt'] },
      { name: 'Pencil Skirts', products: ['Tailored Pencil Skirt', 'High-Waist Pencil Skirt'] },
      { name: 'Waistcoats', products: ['Tailored Wool Waistcoat', 'Formal Satin Waistcoat'] },
      { name: 'Formal Trousers', products: ['Pleated Formal Trousers', 'Slim Fit Dress Trousers'] },
      { name: 'Blazer Sets', products: ['Matching Blazer & Trouser Set', 'Formal Skirt Blazer Set'] },
      { name: 'Neckties', products: ['Silk Formal Necktie', 'Skinny Formal Necktie'] },
      { name: 'Formal Gowns', products: ['Structured Formal Gown', 'Column Formal Evening Gown'] },
    ],
  },
  {
    name: 'Casual Wear',
    subcategories: [
      { name: 'Casual Shirts', products: ['Linen Casual Shirt', 'Printed Resort Shirt', 'Chambray Casual Shirt'] },
      { name: 'Denim Shorts', products: ['High-Rise Denim Shorts', 'Distressed Denim Shorts'] },
      { name: 'Graphic Tees', products: ['Retro Logo Graphic Tee', 'Band Print Graphic Tee'] },
      { name: 'Casual Rompers', products: ['Belted Casual Romper', 'Floral Print Romper'] },
      { name: 'Jumpsuits', products: ['Wide-Leg Utility Jumpsuit', 'Fitted Denim Jumpsuit'] },
      { name: 'Overalls', products: ['Classic Denim Overalls', 'Cropped Corduroy Overalls'] },
      { name: 'Flannel Shirts', products: ['Plaid Flannel Shirt', 'Oversized Flannel Shirt'] },
      { name: 'Casual Dresses', products: ['Everyday T-Shirt Dress', 'Button-Front Casual Dress'] },
    ],
  },
  {
    name: 'Party Wear',
    subcategories: [
      { name: 'Sequin Dresses', products: ['All-Over Sequin Mini Dress', 'Sequin Wrap Dress', 'Sequin Halter Dress'] },
      { name: 'Party Jumpsuits', products: ['Sequin Party Jumpsuit', 'Halter Neck Party Jumpsuit'] },
      { name: 'Glitter Tops', products: ['Metallic Glitter Cami Top', 'Sequin Party Top'] },
      { name: 'Cocktail Suits', products: ['Satin Cocktail Suit', 'Velvet Party Suit'] },
      { name: 'Party Skirts', products: ['Sequin Mini Skirt', 'Metallic Pleated Skirt'] },
      { name: 'Statement Gowns', products: ['Feather Trim Statement Gown', 'High-Slit Statement Gown'] },
      { name: 'Metallic Jackets', products: ['Metallic Foil Jacket', 'Sequin Party Blazer'] },
      { name: 'Embellished Tops', products: ['Beaded Embellished Top', 'Crystal Embellished Blouse'] },
    ],
  },
  {
    name: 'Winter Wear',
    subcategories: [
      { name: 'Puffer Jackets', products: ['Long Puffer Jacket', 'Cropped Puffer Jacket', 'Hooded Puffer Jacket'] },
      { name: 'Thermal Wear', products: ['Thermal Base Layer Top', 'Thermal Leggings'] },
      { name: 'Wool Sweaters', products: ['Merino Wool Sweater', 'Chunky Wool Pullover'] },
      { name: 'Fleece Jackets', products: ['Zip-Up Fleece Jacket', 'Sherpa Lined Fleece Jacket'] },
      { name: 'Snow Boots', products: ['Insulated Snow Boots', 'Waterproof Winter Boots'] },
      { name: 'Woolen Scarves', products: ['Chunky Knit Woolen Scarf', 'Tartan Woolen Scarf'] },
      { name: 'Winter Coats', products: ['Wool Blend Winter Coat', 'Long Down-Filled Coat'] },
      { name: 'Knit Beanies', products: ['Ribbed Knit Beanie', 'Pom-Pom Knit Beanie'] },
    ],
  },
  {
    name: 'Summer Wear',
    subcategories: [
      { name: 'Sundresses', products: ['Floral Cotton Sundress', 'Tiered Linen Sundress', 'Gingham Cotton Sundress'] },
      { name: 'Linen Shirts', products: ['Relaxed Linen Shirt', 'Short-Sleeve Linen Shirt'] },
      { name: 'Beachwear', products: ['Crochet Beach Cover-Up', 'Printed Swim Cover-Up'] },
      { name: 'Cotton Shorts', products: ['Lightweight Cotton Shorts', 'Elastic Waist Cotton Shorts'] },
      { name: 'Summer Rompers', products: ['Linen Summer Romper', 'Floral Print Romper Shorts'] },
      { name: 'Straw Hats', products: ['Wide Brim Straw Hat', 'Woven Panama Hat'] },
      { name: 'Flip Flops', products: ['Classic Rubber Flip Flops', 'Cushioned Beach Flip Flops'] },
      { name: 'Light Cardigans', products: ['Cotton Summer Cardigan', 'Sheer Knit Cover-Up Cardigan'] },
    ],
  },
  {
    name: 'Sleepwear',
    subcategories: [
      { name: 'Pajama Sets', products: ['Cotton Printed Pajama Set', 'Satin Pajama Set', 'Flannel Pajama Set'] },
      { name: 'Nightgowns', products: ['Lace Trim Nightgown', 'Cotton Jersey Nightgown'] },
      { name: 'Robes', products: ['Fleece Bathrobe', 'Satin Kimono Robe'] },
      { name: 'Sleep Shorts', products: ['Cotton Sleep Shorts', 'Printed Boxer Sleep Shorts'] },
      { name: 'Loungewear Sets', products: ['Ribbed Loungewear Set', 'Waffle Knit Loungewear Set'] },
      { name: 'Camisole Sets', products: ['Satin Camisole Set', 'Lace Trim Camisole Set'] },
      { name: 'Sleep Onesies', products: ['Fleece Sleep Onesie', 'Cotton Jersey Onesie'] },
      { name: 'Nightshirts', products: ['Oversized Cotton Nightshirt', 'Button-Front Nightshirt'] },
    ],
  },
  {
    name: 'Ethnic Wear',
    subcategories: [
      { name: 'Anarkali Suits', products: ['Floor-Length Anarkali Suit', 'Embroidered Anarkali Set', 'Georgette Anarkali Suit'] },
      { name: 'Palazzo Sets', products: ['Printed Palazzo Suit Set', 'Embroidered Palazzo Set'] },
      { name: 'Ethnic Jackets', products: ['Embroidered Ethnic Jacket', 'Quilted Ethnic Jacket'] },
      { name: 'Dupattas', products: ['Chiffon Embroidered Dupatta', 'Banarasi Silk Dupatta'] },
      { name: 'Ethnic Gowns', products: ['Embroidered Ethnic Gown', 'Flared Ethnic Gown'] },
      { name: 'Indo-Western Sets', products: ['Cape Style Indo-Western Set', 'Dhoti Style Indo-Western Set'] },
      { name: 'Ethnic Skirts', products: ['Mirror Work Ethnic Skirt', 'Embroidered Ethnic Skirt'] },
      { name: 'Bandhgala Suits', products: ['Classic Bandhgala Suit', 'Embroidered Bandhgala Set'] },
    ],
  },
  {
    name: 'Layering Pieces',
    subcategories: [
      { name: 'Denim Vests', products: ['Classic Sleeveless Denim Vest', 'Distressed Denim Vest', 'Embroidered Denim Vest'] },
      { name: 'Kimonos', products: ['Printed Kimono Cover-Up', 'Floral Duster Kimono'] },
      { name: 'Shrugs', products: ['Knit Bolero Shrug', 'Lace Cropped Shrug'] },
      { name: 'Ponchos', products: ['Fringe Knit Poncho', 'Wool Blend Poncho'] },
      { name: 'Capes', products: ['Wool Blend Cape Coat', 'Tailored Sleeveless Cape'] },
      { name: 'Bolero Jackets', products: ['Cropped Velvet Bolero', 'Lace Bolero Jacket'] },
      { name: 'Long Cardigans', products: ['Duster Longline Cardigan', 'Ribbed Long Cardigan'] },
      { name: 'Utility Vests', products: ['Multi-Pocket Utility Vest', 'Canvas Utility Vest'] },
    ],
  },
];
