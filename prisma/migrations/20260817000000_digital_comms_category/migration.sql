-- Splits digital-channel work (官網/社群/電子報 etc.) out of 溝通管理 into
-- its own category under the 傳播事務 module, per the OCS restructuring
-- discussion. Existing project tagging is untouched here — actually
-- assigning this category to specific projects is done via the
-- /admin/split-digital-comms preview-then-apply tool, not this migration.
INSERT INTO "Category" ("id", "name", "color", "order", "moduleId") VALUES
  ('category-digital', '數位傳播', 'blue', 6, 'module-comm')
ON CONFLICT ("name") DO NOTHING;
