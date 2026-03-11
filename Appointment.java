import java.io.Serializable;

public class Appointment implements Serializable {
    private String id;
    private String name;
    private String email;
    private String phone;
    private String date;
    private String time;
    private String purpose;
    private String status;

    public Appointment(String id, String name, String email, String phone,
                       String date, String time, String purpose) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.date = date;
        this.time = time;
        this.purpose = purpose;
        this.status = "Confirmed";
    }

    public String getId() { return id; }
    public String getName() { return name; }
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getDate() { return date; }
    public String getTime() { return time; }
    public String getPurpose() { return purpose; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String toJSON() {
        return "{" +
            "\"id\":\"" + id + "\"," +
            "\"name\":\"" + name + "\"," +
            "\"email\":\"" + email + "\"," +
            "\"phone\":\"" + phone + "\"," +
            "\"date\":\"" + date + "\"," +
            "\"time\":\"" + time + "\"," +
            "\"purpose\":\"" + purpose + "\"," +
            "\"status\":\"" + status + "\"" +
            "}";
    }
}