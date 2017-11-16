package db.mongodb;

//This line needs manual import.
import static com.mongodb.client.model.Filters.eq;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.bson.Document;

import com.mongodb.Block;
import com.mongodb.MongoClient;
import com.mongodb.client.FindIterable;
import com.mongodb.client.MongoDatabase;
import com.mongodb.client.model.UpdateOptions;

import db.DBConnection;
import entity.Item;
import entity.Item.ItemBuilder;
import external.ExternalAPI;
import external.ExternalAPIFactory;


public class MongoDBConnection implements DBConnection {
	private MongoClient mongoClient;
	private MongoDatabase db;

	public MongoDBConnection () {
		// Connects to local mongodb server.
		mongoClient = new MongoClient();
		db = mongoClient.getDatabase(MongoDBUtil.DB_NAME);
	}

	@Override
	public void close() {
		if (mongoClient != null) {
			mongoClient.close();
		}
	}

	@Override
	public void setFavoriteItems(String userId, List<String> itemIds) {
		db.getCollection("users").updateOne(new Document("user_id", userId),
				new Document("$push", new Document("favorite", new Document("$each", itemIds))));
	}

	@Override
	public void unsetFavoriteItems(String userId, List<String> itemIds) {
		db.getCollection("users").updateOne(new Document("user_id", userId),
				new Document("$pullAll", new Document("favorite", itemIds)));
	}

	@Override
	public Set<String> getFavoriteItemIds(String userId) {
		Set<String> favoriteItems = new HashSet<String>();
		//找到所有user_id == userId的用户，存在iterable中
		FindIterable<Document> iterable = db.getCollection("users").find(eq("user_id", userId));
		if (iterable.first().containsKey("favorite")) {
			@SuppressWarnings("unchecked")
			List<String> list = (List<String>) iterable.first().get("favorite");
			//存入set
			favoriteItems.addAll(list);
		}
		return favoriteItems;
	}

	@Override
	public Set<Item> getFavoriteItems(String userId) {
		Set<String> itemIds = getFavoriteItemIds(userId);
		Set<Item> favoriteItems = new HashSet<>();

		for (String itemId : itemIds) {
			// iterable里只有一个item
			FindIterable<Document> iterable = db.getCollection("items").find(eq("item_id", itemId));
			ItemBuilder builder = new ItemBuilder();

			Document doc = iterable.first();
			builder.setItemId(doc.getString("item_id"));
			builder.setName(doc.getString("name"));
			builder.setCity(doc.getString("city"));
			builder.setState(doc.getString("state"));
			builder.setCountry(doc.getString("country"));
			builder.setZipcode(doc.getString("zipcode"));
			builder.setRating(doc.getDouble("rating"));
			builder.setAddress(doc.getString("address"));
			builder.setLatitude(doc.getDouble("latitude"));
			builder.setLongitude(doc.getDouble("longitude"));
			builder.setDescription(doc.getString("description"));
			builder.setSnippet(doc.getString("snippet"));
			builder.setSnippetUrl(doc.getString("snippet_url"));
			builder.setImageUrl(doc.getString("image_url"));
			builder.setUrl(doc.getString("url"));

			// get all categories for this itemId
			builder.setCategories(getCategories(itemId));
			favoriteItems.add(builder.build());
		}
		return favoriteItems;
	}

	@Override
	public Set<String> getCategories(String itemId) {
		Set<String> categories = new HashSet<String>();
		//找到所有user_id == userId的用户，存在iterable中
		FindIterable<Document> iterable = db.getCollection("items").find(eq("item_id", itemId));
		if (iterable.first().containsKey("categories")) {
			@SuppressWarnings("unchecked")
			List<String> list = (List<String>) iterable.first().get("categories");
			//存入set
			categories.addAll(list);
		}
		return categories;
	}

	@Override
	public List<Item> searchItems(String userId, double lat, double lon, String term) {
		// Connect to external API
		ExternalAPI api = ExternalAPIFactory.getExternalAPI(); // moved here
		List<Item> items = api.search(lat, lon, term);
		for (Item item : items) {
			// Save the item into our own db.
			saveItem(item);
		}
		return items;
	}

	@Override
	public void saveItem(Item item) {
		// You can construct the query like
		// db.getCollection("items").find(new Document().append("item_id", item.getItemId()))
		//new Document 相当于{...}
		// But the java drive provides you a clearer way to do this.

		//可以一个一个遍历的容器
		FindIterable<Document> iterable = db.getCollection("items").find(eq("item_id", item.getItemId()));
		if (iterable.first() == null) { //没找到
			db.getCollection("items")
					.insertOne(new Document().append("item_id", item.getItemId()).append("name", item.getName())
							.append("city", item.getCity()).append("state", item.getState())
							.append("country", item.getCountry()).append("zip_code", item.getZipcode())
							.append("rating", item.getRating()).append("address", item.getAddress())
							.append("latitude", item.getLatitude()).append("longitude", item.getLongitude())
							.append("description", item.getDescription()).append("snippet", item.getSnippet())
							.append("snippet_url", item.getSnippetUrl()).append("image_url", item.getImageUrl())
							.append("url", item.getUrl()).append("categories", item.getCategories()));
		}
	}

	@Override
	public String getFullname(String userId) {
		// TODO Auto-generated method stub
		return null;
	}

	@Override
	public boolean verifyLogin(String userId, String password) {
		// TODO Auto-generated method stub
		return false;
	}

}
