//this file is to demo the java Servlet implementation of search route
//after receiving a search request, rpc will parse the request to get userId, longitude, latitude and keyword
//read data from TicketMaster API based on userId, longitude, latitude and keyword
//filter the data and store in database
//render fun evetn item in web page based on the specific 'favorite' attribute of each item
package rpc;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import db.DBConnection;
import db.DBConnectionFactory;
import entity.Item;
import external.ExternalAPI;
import external.ExternalAPIFactory;
import external.TicketMasterAPI;

/**
 * Servlet implementation class SearchItem
 */
@WebServlet("/search") // 代表URL地址
public class SearchItem extends HttpServlet {
	private static final long serialVersionUID = 1L;

	/**
	 * @see HttpServlet#HttpServlet()
	 */
	public SearchItem() {
		super();
		// TODO Auto-generated constructor stub
	}

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		// Get parameter from HTTP request from 前端
		String userId = request.getParameter("user_id");
		double lat = Double.parseDouble(request.getParameter("lat"));
		double lon = Double.parseDouble(request.getParameter("lon"));
		String term = request.getParameter("term"); // Term can be empty or null.

		// call TicketMasterAPI.search to get event data
//		ExternalAPI api = ExternalAPIFactory.getExternalAPI();
//		List<Item> items = api.search(lat, lon, term);

		// There should be some saveItem logic here
		//把List<Item>存在数据库
		DBConnection conn = DBConnectionFactory.getDBConnection();
		List<Item> items = conn.searchItems(userId, lat, lon, term);
		//item 已经被保存在mysql了
		
		
		// Convert Item list back to JSONArray for client --> 前端读得懂
		List<JSONObject> list = new ArrayList<>();
		//given userID,找到所有收藏过的event_id
		//对每一个搜索得到的item, 判断一下他是不是已经被收藏过
		Set<String> favorite = conn.getFavoriteItemIds(userId);
		try {
			for (Item item : items) {
				JSONObject obj = item.toJSONObject();
				//加一个field, 看看他是否被收藏过(true, false) -->让前端显示💖
				if (favorite != null) {
					obj.put("favorite", favorite.contains(item.getItemId()));
				}
				list.add(obj);
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		JSONArray array = new JSONArray(list);
		RpcHelper.writeJsonArray(response, array);
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse
	 *      response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response)
			throws ServletException, IOException {
		// TODO Auto-generated method stub
		doGet(request, response);
	}

}
