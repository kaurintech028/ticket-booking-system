async function createShow(e) {
  e.preventDefault();
  setCreatingShow(true);

  try {
    // Build pricing array from venue categories
    const venue = venues.find((v) => v._id === showForm.venueId);

    const pricing =
      venue?.seatLayout.map((bl) => ({
        category: bl.category,
        price: Number(showForm[`price_${bl.category}`] || 0),
      })) || [];

    await api.post("/shows", { ...showForm, pricing });

    toast.success("Show created with seats!");

    const { data } = await api.get("/shows/organiser/my-shows");
    setShows(data);

    // Reset form
    setShowForm({
      eventId: "",
      venueId: "",
      date: "",
      pricing: [],
    });

    // Automatically switch to Shows tab
    setTab("shows");
  } catch (err) {
    toast.error(err.response?.data?.message || "Failed");
  } finally {
    setCreatingShow(false);
  }
}
