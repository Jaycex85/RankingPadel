import { searchAfp } from "../../../lib/connectors/afp";
import { searchPwb } from "../../../lib/connectors/pwb";
import { searchTennisVlaanderen } from "../../../lib/connectors/tennisVlaanderen";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nom = (searchParams.get("nom") || "").trim();
  const prenom = (searchParams.get("prenom") || "").trim();

  if (!nom && !prenom) {
    return Response.json(
      { error: "Merci de fournir au moins un nom ou un prenom." },
      { status: 400 }
    );
  }

  const connectors = [
    { federation: "AFP", run: () => searchAfp(nom, prenom) },
    { federation: "PWB", run: () => searchPwb(nom, prenom) },
    { federation: "Tennis Vlaanderen", run: () => searchTennisVlaanderen(nom, prenom) },
  ];

  const settled = await Promise.allSettled(connectors.map((c) => c.run()));

  const results = [];
  const errors = [];

  settled.forEach((outcome, i) => {
    const federation = connectors[i].federation;
    if (outcome.status === "fulfilled") {
      results.push(...outcome.value);
    } else {
      errors.push({ federation, message: String(outcome.reason?.message || outcome.reason) });
    }
  });

  return Response.json({ query: { nom, prenom }, results, errors });
}
