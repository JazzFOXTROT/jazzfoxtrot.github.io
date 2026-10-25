// Commercial Design (Figma "Portfolio" V4, node 48:1281): three categories, each opens a CircularGallery.
// Captions are read from the works themselves; image paths resolve through asset().
export const commercialIntro = {
  title: 'Commercial Design',
  lines: 'Ads, campaigns and brand stores I created at KSP for global brands.',
};

export const commercial = [
  {
    id: 'original',
    title: "Original Design",
    lines: "From initial concept to final execution, including visual direction, layout, typography, and composition.",
    items: [
      { image: "commercial/original/gucci-flora.webp", text: "Gucci Flora Gorgeous Gardenia" },
      { image: "commercial/original/solgar-supherb.webp", text: "Solgar & Supherb" },
      { image: "commercial/original/braun.webp", text: "Braun" },
      { image: "commercial/original/ultimate-ears-wonderboom.webp", text: "Ultimate Ears Wonderboom 4" },
      { image: "commercial/original/ultimate-ears-giveaway.webp", text: "Ultimate Ears Giveaway" },
    ],
  },
  {
    id: 'campaign',
    title: "Campaign Design",
    lines: "Created campaign visuals using brand-provided assets, developing the layout, typography, and visual hierarchy.",
    items: [
      { image: "commercial/campaign/barbie.webp", text: "Barbie" },
      { image: "commercial/campaign/hot-wheels.webp", text: "Hot Wheels" },
      { image: "commercial/campaign/lego.webp", text: "LEGO" },
      { image: "commercial/campaign/xiaomi.webp", text: "Xiaomi Mega Sale" },
      { image: "commercial/campaign/mattel-store.webp", text: "Mattel brand store" },
      { image: "commercial/campaign/lilo-stitch-store.webp", text: "Lilo & Stitch store" },
      { image: "commercial/campaign/dreame-store.webp", text: "Dreame Beauty brand store" },
      { image: "commercial/campaign/philips-water-store.webp", text: "Philips Water store" },
      { image: "commercial/campaign/cabletime-store.webp", text: "Cabletime brand store" },
      { image: "commercial/campaign/matias-store.webp", text: "Matias store" },
    ],
  },
  {
    id: 'adaptation',
    title: "Brand Adaptation & Localization",
    lines: "Adapted existing brand creatives for Hebrew-speaking audiences and KSP's digital formats, refining layouts, typography, and campaign messaging.",
    items: [
      { image: "commercial/adaptation/samsung-s26.webp", text: "Samsung Galaxy S26" },
      { image: "commercial/adaptation/samsung-fold.webp", text: "Samsung Galaxy Z Fold8" },
      { image: "commercial/adaptation/samsung-tv.webp", text: "Samsung OLED TV" },
      { image: "commercial/adaptation/razer-pikachu.webp", text: "Razer × Pokémon: Pikachu & Eevee" },
      { image: "commercial/adaptation/razer-basilisk.webp", text: "Razer Basilisk V4 HyperSpeed" },
      { image: "commercial/adaptation/razer-espeon.webp", text: "Razer × Pokémon: Espeon & Umbreon" },
      { image: "commercial/adaptation/lg-oled.webp", text: "LG OLED: AI to Eye" },
      { image: "commercial/adaptation/sony-bravia.webp", text: "Sony BRAVIA OLED" },
      { image: "commercial/adaptation/garmin-store.webp", text: "Garmin brand store" },
    ],
  },
];
