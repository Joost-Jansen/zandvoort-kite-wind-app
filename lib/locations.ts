export type KiteLocation = {
  slug: string;
  name: string;
  shortName: string;
  latitude: number;
  longitude: number;
  region: string;
};

export const KITE_LOCATIONS: KiteLocation[] = [
  {
    slug: "zandvoort",
    name: "Zandvoort aan Zee",
    shortName: "Zandvoort",
    latitude: 52.3745,
    longitude: 4.5305,
    region: "North Holland",
  },
  {
    slug: "ijmuiden",
    name: "IJmuiden",
    shortName: "IJmuiden",
    latitude: 52.4608,
    longitude: 4.5569,
    region: "North Holland",
  },
  {
    slug: "scheveningen",
    name: "Scheveningen",
    shortName: "Scheveningen",
    latitude: 52.1133,
    longitude: 4.2811,
    region: "South Holland",
  },
  {
    slug: "brouwersdam",
    name: "Brouwersdam",
    shortName: "Brouwersdam",
    latitude: 51.7652,
    longitude: 3.8496,
    region: "Zeeland",
  },
  {
    slug: "workum",
    name: "Workum",
    shortName: "Workum",
    latitude: 52.9797,
    longitude: 5.4493,
    region: "Friesland",
  },
  {
    slug: "texel",
    name: "Texel Paal 17",
    shortName: "Texel",
    latitude: 53.0472,
    longitude: 4.7082,
    region: "Wadden Islands",
  },
];

export const DEFAULT_LOCATION = KITE_LOCATIONS[0];

export function getLocationBySlug(slug?: string | null) {
  if (!slug) {
    return DEFAULT_LOCATION;
  }

  return KITE_LOCATIONS.find((location) => location.slug === slug) ?? DEFAULT_LOCATION;
}