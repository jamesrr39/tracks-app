import Breadcrumb from "./breadcrumb/Breadcrumb";

const styles = {
    list: {
        listStyleType: 'none'
    }
}

function HomeScreen() {
    return (
        <>
            <Breadcrumb pathFragments={[]} />
            <h1>Tracks</h1>
            <ul style={styles.list}>
                <li><a href="/tracks">Tracks</a></li>
                <li><a href="/maps">Maps</a></li>
            </ul>
        </>
    );
}

export default HomeScreen;
