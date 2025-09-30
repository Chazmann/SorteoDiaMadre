'use server';
/**
 * @fileOverview Generates an image with four random numbers for the 'Sorteo Día de la Madre' lottery,
 * incorporating the seller's name, buyer's name, and buyer's phone number into the image.
 *
 * - generateMotherSDayImage - A function that handles the image generation process.
 * - GenerateMotherSDayImageInput - The input type for the generateMotherSDayImage function.
 * - GenerateMotherSDayImageOutput - The return type for the generateMotherSDayImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateMotherSDayImageInputSchema = z.object({
  sellerName: z.string().describe("The name of the seller."),
  buyerName: z.string().describe("The name of the buyer."),
  buyerPhoneNumber: z.string().describe("The phone number of the buyer."),
  numbers: z.array(z.number()).length(4).describe("Four unique random numbers between 0 and 999."),
});
export type GenerateMotherSDayImageInput = z.infer<typeof GenerateMotherSDayImageInputSchema>;

const GenerateMotherSDayImageOutputSchema = z.object({
  image: z.string().describe("The generated image as a data URI."),
});
export type GenerateMotherSDayImageOutput = z.infer<typeof GenerateMotherSDayImageOutputSchema>;

export async function generateMotherSDayImage(input: GenerateMotherSDayImageInput): Promise<GenerateMotherSDayImageOutput> {
  return generateMotherSDayImageFlow(input);
}

// This function now uses a static SVG template and injects the data into it.
// This is much faster than generating an SVG from scratch with an LLM on every call.
const generateSvgTemplate = (input: GenerateMotherSDayImageInput): string => {
  const numbersHtml = input.numbers
    .map(num => `<div class="number">${String(num).padStart(3, '0')}</div>`)
    .join('');

  return `
    <svg width="500" height="300" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <defs>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Belleza&amp;family=Playfair+Display:wght@700&amp;display=swap');
          .container {
            font-family: 'Belleza', sans-serif;
            color: white;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 20px;
            box-sizing: border-box;
          }
          .title {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: 700;
            text-shadow: 1px 1px 3px rgba(0,0,0,0.2);
          }
          .numbers-container {
            display: flex;
            gap: 15px;
            margin: 15px 0;
          }
          .number {
            background-color: rgba(255, 255, 255, 0.2);
            border: 1px solid white;
            border-radius: 8px;
            width: 70px;
            height: 70px;
            font-size: 36px;
            font-weight: bold;
            display: flex;
            justify-content: center;
            align-items: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          .details {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 5px 15px;
            font-size: 13px;
          }
          .detail-item {
            display: flex;
            flex-direction: column;
          }
          .detail-label {
            font-size: 11px;
            opacity: 0.8;
          }
        </style>
      </defs>
      <rect width="100%" height="100%" fill="url(#grad)" />
      <foreignObject width="500" height="300">
        <div xmlns="http://www.w3.org/1999/xhtml" class="container">
          <div class="title">Sorteo Día de la Madre</div>
          <div class="numbers-container">
            ${numbersHtml}
          </div>
          <div class="details">
            <div class="detail-item">
              <span class="detail-label">Vendido por</span>
              <span>${input.sellerName}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Comprador</span>
              <span>${input.buyerName}</span>
            </div>
             <div class="detail-item">
              <span class="detail-label">Fecha del Sorteo</span>
              <span>Octubre 28, 2025</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Teléfono</span>
              <span>${input.buyerPhoneNumber}</span>
            </div>
          </div>
        </div>
      </foreignObject>
       <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F8BBD0;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#E91E63;stop-opacity:1" />
      </linearGradient>
    </svg>
  `;
};


const generateMotherSDayImageFlow = ai.defineFlow(
  {
    name: 'generateMotherSDayImageFlow',
    inputSchema: GenerateMotherSDayImageInputSchema,
    outputSchema: GenerateMotherSDayImageOutputSchema,
  },
  async input => {
    // Generate the SVG code using the template function.
    const svgCode = generateSvgTemplate(input);
    
    // Encode the SVG code to a Base64 data URI.
    const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgCode).toString('base64')}`;

    return {
      image: svgDataUri,
    };
  }
);
