const LINE_ACCESS_TOKEN = '';





function doPost(e) {
  const json = JSON.parse(e.postData.contents);


  json.events.forEach(event => {
    const token = event.replyToken;
    const group_id = event.source.groupId;

    switch (event.type) {

      case "message":

        if (event.message.type === 'text') {
          const userMessage = event.message.text;
          if (userMessage === 'ขอเมนู') {
            const groupSummary = getGroupSummary(group_id);
            const group_name = groupSummary.groupName;

            if (group_name === 'Test-Group') {
              sendFlexMenu(token);
            } else {
              sendReply(token, `group นี้เมนูยังไม่พร้อมใช้งาน`);
            }
          } else {
            sendReply(token, `คุณพิมพ์ว่า: ${userMessage}`);
          }
        }
        break;


      case "memberJoined":

        if (event.source.groupId) {
          event.joined.members.forEach(member => {
            const user_id = member.userId;
            const userProfile = getUserProfile(user_id);
            if (userProfile) {
              const user_name = userProfile.displayName;
              const user_email = userProfile.email || "email-not-found";
              saveUserToSheet(user_id, user_name, user_email);
            }
          });
        }
        break;


      case "join":

        if (event.source.groupId) {
          const groupSummary = getGroupSummary(group_id);
          if (groupSummary) {
            const group_name = groupSummary.groupName || "Unknown Group";

            saveGroupToSheet(group_id, group_name);
          }
        }
        break;

    }












    // if (event.source && event.source.userId) {
    //       const userId = event.source.userId;
    //       console.log(`User ID: ${userId}`);

    //       const userProfile = getUserProfile(userId);
    //       if (userProfile) {
    //           console.log(`User Name: ${userProfile.displayName}`);
    //           sendReply(event.replyToken, `User ID: ${userId}`);
    //           sendReply(event.replyToken, `สวัสดี ${userProfile.displayName}`);

    //       }
    //   }


    //   if (event.type === 'message' && event.message.type === 'text') {
    //       const replyToken = event.replyToken;
    //       const userMessage = event.message.text;

    //       // หากผู้ใช้พิมพ์ว่า "ขอเมนู"
    //       if (userMessage === 'ขอเมนู') {
    //           sendFlexMenu(replyToken);  
    //       } else {
    //           sendReply(replyToken, `คุณพิมพ์ว่า: ${userMessage}`);
    //       }
    //   }

    //   // ดึงข้อมูลโปรไฟล์ของผู้ใช้
    //   if (event.source && event.source.userId) {
    //       const userId = event.source.userId;
    //       console.log(`User ID: ${userId}`);

    //       const userProfile = getUserProfile(userId);
    //       if (userProfile) {
    //           console.log(`User Name: ${userProfile.displayName}`);
    //           sendReply(event.replyToken, `สวัสดี ${userProfile.displayName}`);
    //       }
    //   }
  });

  return ContentService.createTextOutput(JSON.stringify({ status: 'success' }));
}


function sendFlexMenu(replyToken) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
  };

  const flexMessage = {
    type: 'flex',
    altText: 'นี่คือเมนูของเรา',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'เลือกเมนูที่ต้องการ',
            weight: 'bold',
            size: 'md',
            margin: 'sm'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: 'เมนู 1',
              text: 'เลือกเมนู 1'
            },
            style: 'primary',
            margin: 'sm'
          },
          {
            type: 'button',
            action: {
              type: 'message',
              label: 'เมนู 2',
              text: 'เลือกเมนู 2'
            },
            style: 'primary',
            margin: 'sm'
          }
        ]
      }
    }
  };

  const postData = {
    replyToken: replyToken,
    messages: [flexMessage]
  };

  const options = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(postData),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log("Flex menu sent response: " + response.getContentText());
  } catch (error) {
    Logger.log("Error sending flex menu: " + error.message);
  }
}




function sendReply(replyToken, message) {
  const url = 'https://api.line.me/v2/bot/message/reply';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
  };

  const postData = {
    replyToken: replyToken,
    messages: [{
      type: 'text',
      text: message
    }]
  };

  const options = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(postData),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log("Reply sent response: " + response.getContentText());
  } catch (error) {
    Logger.log("Error sending reply: " + error.message);
  }
}


function saveUserToSheet(user_id, user_name, user_email) {

  const sheet = SpreadsheetApp.getActive().getSheetByName('users');


  const data = sheet.getDataRange().getValues();
  const userExists = data.some(row => row[0] === user_id);

  if (!userExists) {
    sheet.appendRow([user_id, user_name, user_email, new Date()]);
    console.log(`User ${user_name} added to the sheet.`);
  } else {
    console.log(`User ${user_name} already exists in the sheet.`);
  }
}

function saveGroupToSheet(group_id, group_name) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('groups');
  const data = sheet.getDataRange().getValues();
  const groupExists = data.some(row => row[0] === group_id);

  if (!groupExists) {
    sheet.appendRow([group_id, group_name, new Date()]);
    console.log(`Group ${group_name} added to the sheet.`);
  } else {
    console.log(`Group ${group_name} already exists in the sheet.`);
  }
}

function getGroupSummary(group_id) {
  const url = `https://api.line.me/v2/bot/group/${group_id}/summary`;
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const groupSummary = JSON.parse(response.getContentText());
    Logger.log(groupSummary);
    return groupSummary;
  } catch (error) {
    console.error(`Failed to get group summary for ${group_id}: ${error.message}`);
    return null;
  }
}

function getUserProfile(userId) {
  const url = `https://api.line.me/v2/bot/profile/${userId}`;
  const headers = {
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
  };

  const options = {
    method: 'get',
    headers: headers,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    if (response.getResponseCode() === 200) {
      const userProfile = JSON.parse(response.getContentText());
      return userProfile;
    } else {
      console.error(`Failed to fetch profile: ${response.getContentText()}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching user profile: ${error.message}`);
    return null;
  }
}


function sendGroupMessage(groupId, message) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
  };

  const postData = {
    to: groupId,
    messages: [{
      type: 'text',
      text: message
    }]
  };

  const options = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(postData)
  };

  UrlFetchApp.fetch(url, options);
}

function sendUserMessage(userId, message) {
  const url = 'https://api.line.me/v2/bot/message/push';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
  };

  const postData = {
    to: userId,
    messages: [{
      type: 'text',
      text: message
    }]
  };

  const options = {
    method: 'post',
    headers: headers,
    payload: JSON.stringify(postData)
  };

  UrlFetchApp.fetch(url, options);
}


////////////////testRichMenu


function createCustomRichMenu() {
  const url = 'https://api.line.me/v2/bot/richmenu';
  const richMenuData = {
    size: { width: 2500, height: 1686 },
    selected: true,
    name: "Main Menu",
    chatBarText: "เมนูหลัก",
    areas: [
      {
        bounds: { x: 0, y: 1400, width: 833, height: 286 },
        action: { type: "message", text: "แจ้งปัญหาอุปกรณ์" }
      },
      {
        bounds: { x: 833, y: 1400, width: 834, height: 286 },
        action: { type: "message", text: "แจ้งปัญหาระบบ" }
      },
      {
        bounds: { x: 1666, y: 1400, width: 834, height: 286 },
        action: { type: "message", text: "คำร้อง" }
      }
    ]
  };

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(richMenuData),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const responseData = JSON.parse(response.getContentText());

  if (responseData.richMenuId) {
    console.log('Rich Menu created successfully with ID:', responseData.richMenuId);
    uploadRichMenuImage(responseData.richMenuId);
  } else {
    console.error('Failed to create Rich Menu:', response.getContentText());
  }
}

function uploadRichMenuImage(richMenuId) {
  const imageUrl = 'https://drive.google.com/uc?export=download&id=10SYO3-SSlHocubJzEddeGUSLguWq2JWr';  // แทนที่ด้วยลิงก์ของภาพที่อัปโหลดบนบริการโฮสต์รูปภาพ เช่น Google Drive หรือ Imgur
  const url = `https://api.line.me/v2/bot/richmenu/${richMenuId}/content`;

  const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob().setContentType('image/jpeg');

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    },
    payload: imageBlob,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log(`Image uploaded for Rich Menu ${richMenuId}:`, response.getContentText());
  } catch (error) {
    console.error(`Failed to upload image for Rich Menu ${richMenuId}: ${error.message}`);
  }
}


function getAllRichMenus() {
  const url = 'https://api.line.me/v2/bot/richmenu/list';
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const data = JSON.parse(response.getContentText());
    console.log("Rich Menus:", JSON.stringify(data));
  } catch (error) {
    console.error("Failed to retrieve Rich Menus:", error.message);
  }
}

function deleteAllRichMenus() {
  const listUrl = 'https://api.line.me/v2/bot/richmenu/list';
  const headers = {
    'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
  };

  const options = {
    method: 'get',
    headers: headers,
    muteHttpExceptions: true
  };

  try {
    // ดึงรายการ Rich Menu ทั้งหมด
    const listResponse = UrlFetchApp.fetch(listUrl, options);
    const listData = JSON.parse(listResponse.getContentText());

    if (listData.richmenus && listData.richmenus.length > 0) {
      listData.richmenus.forEach(richMenu => {
        const richMenuId = richMenu.richMenuId;
        deleteRichMenu(richMenuId);  // ลบแต่ละ Rich Menu ตาม ID
      });
      console.log("All Rich Menus deleted successfully.");
    } else {
      console.log("No Rich Menus found to delete.");
    }
  } catch (error) {
    console.error("Failed to retrieve or delete Rich Menus:", error.message);
  }
}

function deleteRichMenu(richMenuId) {
  const deleteUrl = `https://api.line.me/v2/bot/richmenu/${richMenuId}`;
  const options = {
    method: 'delete',
    headers: {
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(deleteUrl, options);
    if (response.getResponseCode() === 200) {
      console.log(`Rich Menu with ID ${richMenuId} deleted successfully.`);
    } else {
      console.error(`Failed to delete Rich Menu with ID ${richMenuId}: ${response.getContentText()}`);
    }
  } catch (error) {
    console.error(`Error deleting Rich Menu with ID ${richMenuId}: ${error.message}`);
  }
}

function uploadRichMenuImageTest(richMenuId) {
  const imageUrl = 'https://drive.google.com/uc?export=download&id=10SYO3-SSlHocubJzEddeGUSLguWq2JWr';  
  const url = `https://api.line.me/v2/bot/richmenu/${richMenuId}/content`;

  const imageBlob = UrlFetchApp.fetch(imageUrl).getBlob().setContentType('image/jpeg');

  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    },
    payload: imageBlob,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log(`Image uploaded for Rich Menu ${richMenuId}:`, response.getContentText());
    return response.getResponseCode() === 200;
  } catch (error) {
    console.error(`Failed to upload image for Rich Menu ${richMenuId}: ${error.message}`);
    return false;
  }
}

function getRichMenuImage(richMenuId) {
  const url = `https://api.line.me/v2/bot/richmenu/${richMenuId}/content`;
  const options = {
    method: 'get',
    headers: {
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log(`Rich Menu image status for ${richMenuId}:`, response.getContentText());
  } catch (error) {
    console.error(`Failed to get Rich Menu image for ${richMenuId}: ${error.message}`);
  }
}




function linkRichMenuToUser(userId, richMenuId) {
  const url = `https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`;
  const options = {
    method: 'post',
    headers: {
      'Authorization': `Bearer ${LINE_ACCESS_TOKEN}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    console.log(`Rich Menu linked to user ${userId}: ${response.getContentText()}`);
  } catch (error) {
    console.error(`Failed to link Rich Menu to user ${userId}: ${error.message}`);
  }
}






