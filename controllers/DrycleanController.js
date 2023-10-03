import dbConnection from'../config/db.js';
export const get_category = async (req, res) => {
    try {
    const category = `SELECT title, price FROM dry_clean_services WHERE status = '1' `;
      dbConnection.query(category, function (error, data) {
        if (error) throw error;
        res.json({
          status: true,
          message: "Category retrieved successfully!",
          data: data,
        });
      });

    } catch (error) {
      res.json({ status: false, message: error.message });
    }
  };

  export default {get_category}
  