import java.io.Serializable;

public class TimeSlot implements Serializable {
    private String id;
    private String date;
    private String time;
    private boolean available;

    public TimeSlot(String id, String date, String time, boolean available) {
        this.id = id;
        this.date = date;
        this.time = time;
        this.available = available;
    }

    public String getId() { return id; }
    public String getDate() { return date; }
    public String getTime() { return time; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public String toJSON() {
        return "{" +
            "\"id\":\"" + id + "\"," +
            "\"date\":\"" + date + "\"," +
            "\"time\":\"" + time + "\"," +
            "\"available\":" + available +
            "}";
    }
}