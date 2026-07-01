import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng parameters" }, { status: 400 });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "CivicPulse/1.0 (contact@civicpulse.org)",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Check if the location is outside India
    const countryCode = data.address?.country_code;
    if (countryCode && countryCode.toLowerCase() !== "in") {
      return NextResponse.json(
        { error: "We are currently operable in India only, please wait for us to add this area." },
        { status: 400 }
      );
    }

    // Build a nice neighborhood/suburb string
    const addressInfo = data.address || {};
    const suburb = addressInfo.suburb || addressInfo.neighbourhood || addressInfo.village || addressInfo.subdistrict || "";
    const city = addressInfo.city || addressInfo.town || addressInfo.municipality || addressInfo.county || "";
    const state = addressInfo.state || "";

    const areaParts = [suburb, city].filter(Boolean);
    const area = areaParts.length > 0 ? areaParts.join(", ") : "Unknown Area";
    const fullAddress = data.display_name || "";

    return NextResponse.json({
      area,
      address: fullAddress,
    });
  } catch (err: any) {
    console.error("Geocoding error:", err);
    return NextResponse.json({ error: "Failed to reverse geocode coordinates" }, { status: 500 });
  }
}
