# go-openapix

go-openapix provides some useful convience functions to to [swaggest](https://github.com/swaggest), so that you can build up your APIs in a type-checked and auto-documented way!

Some highlights:

- `MustCreateOpenapiEndpoint` - uses generics to enforce that you are returning the correct (documented) type in code. End-user does not need to use generics themselves, making it simpler to use. It also generates a endpoint name, based on the title you provide - no accidental copy/paste doubling-up endpoints with the same name.
- `MustCheckNonNullArrays` - document `[]` instead of `null` when the array is empty.

## Usage:

```

func main() {
	apiSchema := &openapi.Collector{}
	r := chirouter.NewWrapper(chi.NewRouter())

	r.Use(nethttp.OpenAPIMiddleware(apiSchema))

	... // your setup here

	// add an endpoint
	openapix.Post(r, "/customers", GetAllCustomers(dbConnection, customersStore))

	// check array types are marked as non-null; i.e. no items will return "[]" instead of "null"
   	openapix.MustCheckNonNullArrays(apiSchema.Reflector().Spec.Components.Schemas.MapOfSchemaOrRefValues)

	openapix.MustNotHaveDuplicateOperationIDOrUnknownSecurity(apiSchema.Reflector().Spec)

	// start your web server
}

type GetAllCustomersRequest struct{}

type GetAllCustomersResponse struct {
	Customers []Customer `json:"customers" nullable:"false"`
}

func GetAllCustomers(dbConnection *sql.DB, customersStore *CustomersStore) *nethttp.Handler {
	return openapix.MustCreateOpenapiEndpoint(
		"Get All Customers",
		&openapix.HandlerOptions{Tags: []string{"Customers"}},
		func(ctx context.Context, input *GetAllCustomersRequest, output *GetAllCustomersResponse) error {
			customers, err := customersStore.GetAll(dbConnection)
			if err != nil {
				return status.Wrap(err, status.Internal)
			}

			output.Customers = customers

			return nil
		},
	)
}

```
