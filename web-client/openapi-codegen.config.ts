import {
  generateSchemaTypes,
  generateReactQueryComponents,
  generateReactQueryFunctions,
  generateFetchers,
  forceReactQueryComponent,
} from "@openapi-codegen/typescript";

import { defineConfig } from "@openapi-codegen/cli";
export default defineConfig({
  tracksApp: {
    from: {
      relativePath: "docs/openapi3-spec.yml",
      source: "file",
    },
    outputDir: "src/openapi/generated",
    to: async (context) => {
      const filenamePrefix = "tracksApp";
      const { schemasFiles } = await generateSchemaTypes(context, {
        filenamePrefix,
      });
      await generateFetchers(context, {
        filenamePrefix,
        schemasFiles,
      });
      await generateReactQueryComponents(context, {
        filenamePrefix,
        schemasFiles,
      });
      await generateReactQueryFunctions(context, {
        filenamePrefix,
        schemasFiles,
      });
    },
  },
});
