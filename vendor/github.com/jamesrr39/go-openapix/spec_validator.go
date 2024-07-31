package openapix

import (
	"fmt"
	"slices"

	"github.com/swaggest/openapi-go/openapi3"
	"golang.org/x/exp/maps"
)

func MustNotHaveDuplicateOperationIDOrUnknownSecurity(spec *openapi3.Spec) {
	// map[title]url_path
	summaryMap := map[string]string{}

	allSecuritySchemeNames := maps.Keys(spec.Components.SecuritySchemes.MapOfSecuritySchemeOrRefValues)

	for path, pathItem := range spec.Paths.MapOfPathItemValues {
		for httpMethod, operation := range pathItem.MapOfOperationValues {
			for _, securityMap := range operation.Security {
				for operationSecurityName := range securityMap {
					if !slices.Contains[[]string](allSecuritySchemeNames, operationSecurityName) {
						panic(fmt.Sprintf("Security Scheme for this Operation not defined in Spec Security Schemes. Operation Security: %q, all Spec Security Schemes: %#v", operationSecurityName, allSecuritySchemeNames))
					}
				}
			}

			// check against operation.Summary for duplications.
			// operation.ID increments a suffix if a duplcicate is added (e.g. declaring getUsers twice becomes getUsers and getUsers2), so doesn't work.
			// But checking the summary does.
			if operation.Summary == nil {
				panic(fmt.Sprintf("definition summary (title) was empty for route %s %q", httpMethod, path))
			}

			existingPath, ok := summaryMap[*operation.Summary]
			if ok {
				panic(fmt.Sprintf("definition summary duplication: summary (title): %s %q, paths: %q, %q", httpMethod, *operation.Summary, existingPath, path))
			}

			summaryMap[*operation.Summary] = path
		}
	}
}

// MustCheckNonNullArrays enforces non-null arrays across the whole of your schema.
// Use if desired on your particular schema; this isn't suitable for all schemas.
func MustCheckNonNullArrays(definitionMap map[string]openapi3.SchemaOrRef) {
	for name, definition := range definitionMap {
		if definition.Schema == nil {
			// SchemaOrRef is probably a Ref instead
			continue
		}

		schemaType := *definition.Schema.Type
		switch schemaType {
		case openapi3.SchemaTypeArray:
			if definition.Schema.Nullable != nil && *definition.Schema.Nullable {
				panic(fmt.Sprintf("Property %q is marked as a nullable array. Use the `nullable:\"false\" struct tag to mark as non-nullable.", name))
			}
		case openapi3.SchemaTypeObject:
			MustCheckNonNullArrays(definition.Schema.Properties)
		}
	}
}
