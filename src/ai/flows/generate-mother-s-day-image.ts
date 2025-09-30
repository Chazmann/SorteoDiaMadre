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

const generateMotherSDayImageFlow = ai.defineFlow(
  {
    name: 'generateMotherSDayImageFlow',
    inputSchema: GenerateMotherSDayImageInputSchema,
    outputSchema: GenerateMotherSDayImageOutputSchema,
  },
  async input => {
    const promptText = `
      You are an expert SVG designer. Create an SVG image for a Mother's Day lottery ticket with the following specifications.
      The SVG should be visually appealing, with a floral, pink, and festive theme suitable for Mother's Day.

      The SVG must be 500x300 pixels.

      It must contain the following information, clearly legible:
      - Title: 'Sorteo Día de la Madre'
      - Four unique random numbers: ${JSON.stringify(input.numbers)}
      - Seller's Name: ${input.sellerName}
      - Buyer's Name: ${input.buyerName}
      - Buyer's Phone Number: ${input.buyerPhoneNumber}
      - Drawing Date: October 28, 2025

      Arrange the information in a clear and aesthetically pleasing way. The numbers should be the most prominent visual element.
      Use elegant and readable fonts. You can use Google Fonts.

      Do not include any explanation. Only output the raw SVG code starting with <svg> and ending with </svg>.
    `;

    const {text} = await ai.generate({
      prompt: promptText,
      config: {
        // Lower temperature for more predictable SVG code
        temperature: 0.2,
      },
    });
    
    // Clean the SVG output from the model
    const svgCode = text.replace(/'''/g, '').replace('svg', '').trim();

    // Convert the SVG string to a Base64 data URI
    const svgDataUri = `data:image/svg+xml;base64,${Buffer.from(svgCode).toString('base64')}`;

    return {
      image: svgDataUri,
    };
  }
);
