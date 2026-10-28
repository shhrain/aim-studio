CREATE INDEX "audit_workspace_created" ON "audit_logs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "deliveries_workspace_created" ON "deliveries" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "deliveries_job" ON "deliveries" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "outbox_pending" ON "outbox" USING btree ("available_at") WHERE delivered_at IS NULL AND failed_at IS NULL;