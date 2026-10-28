CREATE TABLE "share_materials" (
	"share_id" text NOT NULL,
	"material_id" text NOT NULL,
	"workspace_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "share_materials" ADD CONSTRAINT "share_materials_share_id_shares_id_fk" FOREIGN KEY ("share_id") REFERENCES "public"."shares"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_materials" ADD CONSTRAINT "share_materials_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_materials" ADD CONSTRAINT "share_materials_workspace_id_organization_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "share_material_unique" ON "share_materials" USING btree ("share_id","material_id");
--> statement-breakpoint
INSERT INTO share_materials(share_id,material_id,workspace_id)
SELECT DISTINCT s.id,m.id,s.workspace_id FROM shares s JOIN materials m ON m.workspace_id=s.workspace_id AND s.document::text LIKE '%/api/v1/files/'||m.id||'%'
ON CONFLICT DO NOTHING;
