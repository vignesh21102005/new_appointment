import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.nio.file.Files;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class AppointmentServer {

    private static List<TimeSlot> timeSlots = new ArrayList<>();
    private static List<Appointment> appointments = new ArrayList<>();
    private static int appointmentCounter = 1;

    public static void main(String[] args) throws Exception {
        initializeTimeSlots();

        // THIS LINE CHANGED - reads PORT from environment variable
        String portStr = System.getenv("PORT");
        int port = 8080;
        if (portStr != null) {
            port = Integer.parseInt(portStr);
        }

        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);

        server.createContext("/api/slots", new SlotsHandler());
        server.createContext("/api/book", new BookingHandler());
        server.createContext("/api/appointments", new AppointmentsHandler());
        server.createContext("/api/cancel", new CancelHandler());
        server.createContext("/", new StaticFileHandler());

        server.setExecutor(null);
        System.out.println("========================================");
        System.out.println("Server Started on port: " + port);
        System.out.println("========================================");
        server.start();
    }

    private static void initializeTimeSlots() {
        String[] times = {
            "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
            "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
            "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM",
            "04:00 PM", "04:30 PM", "05:00 PM"
        };

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        int slotId = 1;

        for (int day = 0; day < 7; day++) {
            String date = LocalDate.now().plusDays(day).format(formatter);
            for (String time : times) {
                timeSlots.add(new TimeSlot("S" + slotId, date, time, true));
                slotId++;
            }
        }
        System.out.println("Initialized " + timeSlots.size() + " time slots.");
    }

    static class SlotsHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equals(exchange.getRequestMethod())) {
                String query = exchange.getRequestURI().getQuery();
                String date = "";

                if (query != null && query.startsWith("date=")) {
                    date = query.substring(5);
                }

                StringBuilder json = new StringBuilder("[");
                boolean first = true;

                for (int i = 0; i < timeSlots.size(); i++) {
                    TimeSlot slot = timeSlots.get(i);
                    if (date.isEmpty() || slot.getDate().equals(date)) {
                        if (!first) {
                            json.append(",");
                        }
                        json.append(slot.toJSON());
                        first = false;
                    }
                }
                json.append("]");

                sendResponse(exchange, 200, json.toString());
            } else {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    static class BookingHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equals(exchange.getRequestMethod())) {
                String body = readRequestBody(exchange);
                Map<String, String> params = parseJSON(body);

                String name = params.get("name");
                String email = params.get("email");
                String phone = params.get("phone");
                String date = params.get("date");
                String time = params.get("time");
                String purpose = params.get("purpose");

                if (name == null) name = "";
                if (email == null) email = "";
                if (phone == null) phone = "";
                if (date == null) date = "";
                if (time == null) time = "";
                if (purpose == null) purpose = "";

                if (name.isEmpty() || email.isEmpty() || date.isEmpty() || time.isEmpty()) {
                    sendResponse(exchange, 400,
                        "{\"success\":false,\"message\":\"Name, email, date, and time are required.\"}");
                    return;
                }

                boolean slotFound = false;
                for (int i = 0; i < timeSlots.size(); i++) {
                    TimeSlot slot = timeSlots.get(i);
                    if (slot.getDate().equals(date) && slot.getTime().equals(time) && slot.isAvailable()) {
                        slot.setAvailable(false);
                        slotFound = true;
                        break;
                    }
                }

                if (!slotFound) {
                    sendResponse(exchange, 400,
                        "{\"success\":false,\"message\":\"Selected time slot is not available.\"}");
                    return;
                }

                String appointmentId = "APT" + String.format("%04d", appointmentCounter);
                appointmentCounter++;

                Appointment appointment = new Appointment(
                    appointmentId, name, email, phone, date, time, purpose
                );
                appointments.add(appointment);

                System.out.println("New booking: " + appointmentId + " - " + name);

                String response = "{\"success\":true,\"message\":\"Appointment booked successfully!\"," +
                    "\"appointment\":" + appointment.toJSON() + "}";
                sendResponse(exchange, 200, response);
            } else {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    static class AppointmentsHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("GET".equals(exchange.getRequestMethod())) {
                String query = exchange.getRequestURI().getQuery();
                String email = "";

                if (query != null && query.startsWith("email=")) {
                    email = query.substring(6);
                }

                StringBuilder json = new StringBuilder("[");
                boolean first = true;

                for (int i = 0; i < appointments.size(); i++) {
                    Appointment apt = appointments.get(i);
                    if (email.isEmpty() || apt.getEmail().equalsIgnoreCase(email)) {
                        if (!first) {
                            json.append(",");
                        }
                        json.append(apt.toJSON());
                        first = false;
                    }
                }
                json.append("]");

                sendResponse(exchange, 200, json.toString());
            } else {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    static class CancelHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            addCORSHeaders(exchange);

            if ("OPTIONS".equals(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            if ("POST".equals(exchange.getRequestMethod())) {
                String body = readRequestBody(exchange);
                Map<String, String> params = parseJSON(body);

                String appointmentId = params.get("id");
                if (appointmentId == null) appointmentId = "";

                boolean found = false;
                for (int i = 0; i < appointments.size(); i++) {
                    Appointment apt = appointments.get(i);
                    if (apt.getId().equals(appointmentId)) {
                        apt.setStatus("Cancelled");

                        for (int j = 0; j < timeSlots.size(); j++) {
                            TimeSlot slot = timeSlots.get(j);
                            if (slot.getDate().equals(apt.getDate()) &&
                                slot.getTime().equals(apt.getTime())) {
                                slot.setAvailable(true);
                                break;
                            }
                        }
                        found = true;
                        System.out.println("Cancelled: " + appointmentId);
                        break;
                    }
                }

                if (found) {
                    sendResponse(exchange, 200,
                        "{\"success\":true,\"message\":\"Appointment cancelled successfully.\"}");
                } else {
                    sendResponse(exchange, 404,
                        "{\"success\":false,\"message\":\"Appointment not found.\"}");
                }
            } else {
                sendResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
            }
        }
    }

    static class StaticFileHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();

            if (path.equals("/")) {
                path = "/index.html";
            }

            String filePath = "frontend" + path;
            File file = new File(filePath);

            if (file.exists() && file.isFile()) {
                String contentType = "text/html";
                if (path.endsWith(".css")) {
                    contentType = "text/css";
                } else if (path.endsWith(".js")) {
                    contentType = "application/javascript";
                }

                byte[] fileBytes = Files.readAllBytes(file.toPath());
                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(200, fileBytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(fileBytes);
                os.close();
            } else {
                String response = "404 - File Not Found";
                exchange.sendResponseHeaders(404, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
            }
        }
    }

    private static void addCORSHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private static void sendResponse(HttpExchange exchange, int statusCode, String response)
            throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        byte[] responseBytes = response.getBytes("UTF-8");
        exchange.sendResponseHeaders(statusCode, responseBytes.length);
        OutputStream os = exchange.getResponseBody();
        os.write(responseBytes);
        os.close();
    }

    private static String readRequestBody(HttpExchange exchange) throws IOException {
        InputStream is = exchange.getRequestBody();
        BufferedReader reader = new BufferedReader(new InputStreamReader(is, "UTF-8"));
        StringBuilder body = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            body.append(line);
        }
        reader.close();
        return body.toString();
    }

    private static Map<String, String> parseJSON(String json) {
        Map<String, String> map = new HashMap<>();
        json = json.trim();
        if (json.startsWith("{")) {
            json = json.substring(1);
        }
        if (json.endsWith("}")) {
            json = json.substring(0, json.length() - 1);
        }

        String[] pairs = json.split(",(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)");
        for (int i = 0; i < pairs.length; i++) {
            String[] keyValue = pairs[i].split(":", 2);
            if (keyValue.length == 2) {
                String key = keyValue[0].trim().replace("\"", "");
                String value = keyValue[1].trim().replace("\"", "");
                map.put(key, value);
            }
        }
        return map;
    }
}