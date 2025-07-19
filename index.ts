import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SHEET_ID = "1485ut13dOQHzyosLWs7afhWVCve6asyeGSB0RI6vv4E";
const API_KEY = "AIzaSyDTo7Vq5hvKXXDXp9dEyEnPyj3iNgMLCZI";
const SHEET_NAME = "Shipment List";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Change this in production
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

serve(async (req) => {
  // ✅ Handle CORS preflight properly
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { shipmentNo, updates } = await req.json();

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`
    );
    const data = await res.json();

    const rows = data.values;
    const header = rows[0];

    const rowIndex = rows.findIndex((row) => row[0] === shipmentNo);
    if (rowIndex === -1) {
      return new Response(JSON.stringify({ error: "Shipment not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const updatedRow = [...rows[rowIndex]];
    for (const key in updates) {
      const colIndex = header.indexOf(key);
      if (colIndex !== -1) {
        updatedRow[colIndex] = updates[key];
      }
    }

    const range = `${SHEET_NAME}!A${rowIndex + 1}:G${rowIndex + 1}`;
    const accessToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?valueInputOption=USER_ENTERED&key=${API_KEY}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ values: [updatedRow] }),
      }
    );

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
