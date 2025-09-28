In old version of the map, the map would open for a while but then route back to login upon failing?

Lets redo the hole imlmenntation now using MapLibre.. i do also want to be able to have offline map access though, vector tiles sem nice. But also how is mapbox

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    paddingTop: 16,
  },
  fullScreenCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  filters: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  ...
});

