DROP INDEX "product_platforms_platform_platform_product_id_key";

CREATE INDEX "product_platforms_platform_platform_product_id_idx" ON "product_platforms"("platform", "platform_product_id");
