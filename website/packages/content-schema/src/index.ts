import architectureNotesJson from "../fixtures/architecture/current.json";
import planMilestonesJson from "../fixtures/plan/current.json";
import actorDefsJson from "../fixtures/schemas/com.para.actor.defs.json";
import communityDefsJson from "../fixtures/schemas/com.para.community.defs.json";
import postJson from "../fixtures/schemas/com.para.post.json";
import statusJson from "../fixtures/schemas/com.para.status.json";
import schemaIndexJson from "../fixtures/schemas/index.json";
import { z } from "zod";

export const schemaStatusSchema = z.enum(["draft", "experimental", "stable"]);

export const fieldDefinitionSchema = z.object({
  name: z.string(),
  type: z.string(),
  required: z.boolean(),
  description: z.string(),
});

export const schemaIndexEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  status: schemaStatusSchema,
  tags: z.array(z.string()),
});

export const schemaDocumentSchema = schemaIndexEntrySchema.extend({
  backendOwner: z.string().optional(),
  sourcePath: z.string().optional(),
  examples: z.array(z.string()).optional(),
  relationships: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  fields: z.array(fieldDefinitionSchema),
});

export const architectureNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  status: z.enum(["active", "planned", "deprecated"]),
});

export const planMilestoneSchema = z.object({
  id: z.string(),
  title: z.string(),
  summary: z.string(),
  target: z.string(),
});

export type FieldDefinition = z.infer<typeof fieldDefinitionSchema>;
export type SchemaIndexEntry = z.infer<typeof schemaIndexEntrySchema>;
export type SchemaDocument = z.infer<typeof schemaDocumentSchema>;
export type ArchitectureNote = z.infer<typeof architectureNoteSchema>;
export type PlanMilestone = z.infer<typeof planMilestoneSchema>;

const schemaDocuments = [
  postJson,
  communityDefsJson,
  actorDefsJson,
  statusJson,
].map((schema) => schemaDocumentSchema.parse(schema));

export function getSchemaIndex(): SchemaIndexEntry[] {
  return z.array(schemaIndexEntrySchema).parse(schemaIndexJson);
}

export function getSchemaDocuments(): SchemaDocument[] {
  return schemaDocuments;
}

export function getSchemaDocument(
  schemaId: string,
): SchemaDocument | undefined {
  return schemaDocuments.find((schema) => schema.id === schemaId);
}

export function getArchitectureNotes(): ArchitectureNote[] {
  return z.array(architectureNoteSchema).parse(architectureNotesJson);
}

export function getPlanMilestones(): PlanMilestone[] {
  return z.array(planMilestoneSchema).parse(planMilestonesJson);
}
