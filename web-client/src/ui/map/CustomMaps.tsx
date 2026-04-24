import { useGetMaps } from "../../openapi/generated/tracksAppComponents";
import Breadcrumb from "../breadcrumb/Breadcrumb";
import Error from "../Error";
import Loading from "../Loading";

function CustomMaps() {

    const { data, isLoading, error } = useGetMaps({});


    if (error) {
        return <Error />;
    }

    if (isLoading) {
        return <Loading />;
    }

    if (!data) {
        return null;
    }

    if (data.customMaps.length == 0) {
        return <p>No custom maps found</p>
    }

    return (
        <>
            <Breadcrumb pathFragments={["maps"]} />
            <table className="table table-striped">
                <thead>
                    <tr><th>Name</th></tr>
                </thead>
                <tbody>
                    {data.customMaps.map(customMap => {
                        return (
                            <tr key={customMap.name}>
                                <td><a href={`/maps/${encodeURIComponent(customMap.name)}`}>{customMap.name}</a></td>
                                <td><img style={{ height: "200px" }} src={`/map/custom-map/${encodeURIComponent(customMap.name)}`} /></td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </>
    )
}

export default CustomMaps;