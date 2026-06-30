import type { GeoLocation } from "./types";

export interface AreaLocation {
  name: string;
  lat: number;
  lng: number;
}

export const BENGALURU_LOCATIONS: AreaLocation[] = [
  { name: "Indiranagar", lat: 12.9719, lng: 77.6412 },
  { name: "Koramangala", lat: 12.9279, lng: 77.6271 },
  { name: "Jayanagar", lat: 12.9308, lng: 77.5833 },
  { name: "Whitefield", lat: 12.9698, lng: 77.7500 },
  { name: "HSR Layout", lat: 12.9103, lng: 77.6450 },
  { name: "Malleshwaram", lat: 12.9960, lng: 77.5712 },
  { name: "BTM Layout", lat: 12.9166, lng: 77.6101 },
  { name: "Marathahalli", lat: 12.9569, lng: 77.7011 },
  { name: "Bellandur", lat: 12.9304, lng: 77.6784 },
  { name: "Hebbal", lat: 13.0354, lng: 77.5988 },
  { name: "Banashankari", lat: 12.9250, lng: 77.5467 },
  { name: "Rajajinagar", lat: 12.9902, lng: 77.5536 },
  { name: "Yelahanka", lat: 13.1007, lng: 77.5963 },
  { name: "Electronic City", lat: 12.8452, lng: 77.6602 },
  { name: "Richmond Town", lat: 12.9647, lng: 77.5999 },
  { name: "Ulsoor", lat: 12.9817, lng: 77.6286 },
  { name: "Basavanagudi", lat: 12.9406, lng: 77.5738 },
  { name: "Sadashivanagar", lat: 13.0068, lng: 77.5802 },
  { name: "Domlur", lat: 12.9610, lng: 77.6387 },
  { name: "MG Road", lat: 12.9738, lng: 77.6119 },
  { name: "Shivajinagar", lat: 12.9857, lng: 77.5973 },
  { name: "RT Nagar", lat: 13.0184, lng: 77.5933 },
  { name: "Yeshwanthpur", lat: 13.0235, lng: 77.5589 },
  { name: "Vijayanagar", lat: 12.9756, lng: 77.5354 },
  { name: "Jalahalli", lat: 13.0526, lng: 77.5419 },
  { name: "Kengeri", lat: 12.9175, lng: 77.4838 },
  { name: "Sarjapur Road", lat: 12.9022, lng: 77.6784 },
  { name: "Kalyan Nagar", lat: 13.0221, lng: 77.6403 },
  { name: "Kammanahalli", lat: 13.0092, lng: 77.6368 },
  { name: "Banaswadi", lat: 13.0142, lng: 77.6481 },
  { name: "Vasanth Nagar", lat: 12.9896, lng: 77.5928 },
  { name: "Frazer Town", lat: 12.9972, lng: 77.6143 },
  { name: "Cooke Town", lat: 13.0028, lng: 77.6198 },
  { name: "Vidyaranyapura", lat: 13.0784, lng: 77.5597 },
  { name: "Sanjaynagar", lat: 13.0378, lng: 77.5784 },
  { name: "New BEL Road", lat: 13.0308, lng: 77.5684 },
  { name: "Wilson Garden", lat: 12.9482, lng: 77.5970 },
  { name: "Shanti Nagar", lat: 12.9555, lng: 77.5968 },
  { name: "JP Nagar", lat: 12.9105, lng: 77.5859 },
  { name: "Bommanahalli", lat: 12.9030, lng: 77.6244 },
  { name: "Mahadevapura", lat: 12.9895, lng: 77.6956 },
  { name: "KR Puram", lat: 13.0117, lng: 77.7011 },
  { name: "CV Raman Nagar", lat: 12.9793, lng: 77.6645 },
  { name: "HAL", lat: 12.9620, lng: 77.6487 },
  { name: "Madiwala", lat: 12.9226, lng: 77.6174 },
  { name: "Bannerghatta Road", lat: 12.8933, lng: 77.5984 },
  { name: "Uttarahalli", lat: 12.9068, lng: 77.5456 },
  { name: "Nagarbhavi", lat: 12.9719, lng: 77.5128 },
  { name: "Peenya", lat: 13.0285, lng: 77.5197 },
  { name: "Mahalakshmi Layout", lat: 13.0105, lng: 77.5484 },
  { name: "Mathikere", lat: 13.0322, lng: 77.5585 },
  { name: "Hoodi", lat: 12.9919, lng: 77.7122 },
  { name: "Kadugodi", lat: 12.9984, lng: 77.7612 },
  { name: "Varthur", lat: 12.9388, lng: 77.7472 },
  { name: "Panathur", lat: 12.9366, lng: 77.7056 },
  { name: "Begur", lat: 12.8804, lng: 77.6322 },
  { name: "Singasandra", lat: 12.8906, lng: 77.6417 },
  { name: "Horamavu", lat: 13.0272, lng: 77.6617 },
  { name: "Ramamurthy Nagar", lat: 13.0120, lng: 77.6775 },
  { name: "Ejipura", lat: 12.9384, lng: 77.6256 },
  { name: "Adugodi", lat: 12.9439, lng: 77.6083 },
  { name: "Tavarekere", lat: 12.9288, lng: 77.6146 },
];

/** Great-circle distance between two coordinates, in metres. */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
